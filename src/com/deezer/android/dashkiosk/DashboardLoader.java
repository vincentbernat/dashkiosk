/*
 * Copyright (c) 2013 Vincent Bernat <vbe@deezer.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

package com.deezer.android.dashkiosk;

import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.json.*;

import android.content.AsyncTaskLoader;
import android.content.Context;
import android.content.SharedPreferences;
import android.net.nsd.*;
import android.os.Handler;
import android.os.Message;
import android.preference.PreferenceManager;
import android.util.Log;

import com.deezer.android.dashkiosk.DashboardPreferences;
import com.deezer.android.dashkiosk.DashboardURL;

/**
 * Load URL from a network service discovery web service.
 */
public class DashboardLoader {

    private static final String TAG = "DashKiosk";
    private Boolean mDiscover;
    private String mPingURL;
    private Integer mTimeout;
    private Integer mSleep;
    private BackgroundThread mThread;
    private NsdManager mNsdManager;

    private static Handler mHandler;

    public DashboardLoader(Context context, Handler handler) {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        mDiscover = !sharedPref.getBoolean("pref_ping_manual_host", false);
        mPingURL = mDiscover?null:sharedPref.getString("pref_ping_url", null);
        mTimeout = Integer.valueOf(sharedPref.getString("pref_ping_timeout", null));
        mSleep = Integer.valueOf(sharedPref.getString("pref_ping_sleep", null));
        mHandler = handler;
        mNsdManager = (NsdManager) context.getSystemService(Context.NSD_SERVICE);
    }

    public void start() {
        mThread = new BackgroundThread();
        mThread.start();
    }

    public void stop() {
        if (mThread != null) {
            mThread.interrupt();
            mThread = null;
        }
    }

    private class BackgroundThread extends Thread {

        private NsdManager.DiscoveryListener mDiscoveryListener;
        private NsdManager.ResolveListener mResolveListener;

        private synchronized void updatePingURL(NsdServiceInfo serviceInfo,
                                                Boolean remove) {
            // Without resolving, we cannot really know if we did
            // remove the right service. So, let's remove the service.
            if (remove) {
                mPingURL = null;
                Log.i(TAG, "Ping URL is gone");
                return;
            }

            try {
                mPingURL = new URL("http",
                                   serviceInfo.getHost().getHostAddress(),
                                   serviceInfo.getPort(),
                                   "/dashboards.json").toString();
            } catch (MalformedURLException ex) {
                Log.e(TAG, "Malformed ping URL", ex);
                return;
            }
            Log.i(TAG, "Ping URL is url=" + mPingURL);
        }

        private void discoverURL() throws InterruptedException {
            if (!mDiscover) return;

            Log.i(TAG, "Trying to discover dashboard service");
            if (mResolveListener == null) {
                mResolveListener = new NsdManager.ResolveListener() {
                        @Override
                        public void onResolveFailed(NsdServiceInfo serviceInfo, int errorCode) {
                            Log.e(TAG, "Resolve failed: " + errorCode);
                        }

                        @Override
                        public void onServiceResolved(NsdServiceInfo serviceInfo) {
                            updatePingURL(serviceInfo, false);
                        }
                    };
            }
            if (mDiscoveryListener == null) {
                mDiscoveryListener = new NsdManager.DiscoveryListener() {
                        @Override
                        public void onDiscoveryStarted(String regType) {
                            Log.i(TAG, "Service discovery started");
                        }

                        @Override
                        public void onDiscoveryStopped(String serviceType) {
                            Log.i(TAG, "Service discovery stopped");
                            mDiscoveryListener = null;
                            mResolveListener = null;
                        }

                        @Override
                        public void onServiceFound(NsdServiceInfo service) {
                            if (service.getServiceName().equals("dashkiosk")) {
                                mNsdManager.resolveService(service, mResolveListener);
                            }
                        }

                        @Override
                        public void onServiceLost(NsdServiceInfo service) {
                            if (service.getServiceName().equals("dashkiosk")) {
                                updatePingURL(service, true);
                            }
                        }

                    @Override
                    public void onStartDiscoveryFailed(String serviceType, int errorCode) {
                        Log.e(TAG, "Discovery failed: " + errorCode);
                        mNsdManager.stopServiceDiscovery(this);
                    }

                    @Override
                    public void onStopDiscoveryFailed(String serviceType, int errorCode) {
                        Log.e(TAG, "Discovery failed: " + errorCode);
                        mNsdManager.stopServiceDiscovery(this);
                    }
                };
                mNsdManager.discoverServices("_http._tcp",
                                             NsdManager.PROTOCOL_DNS_SD,
                                             mDiscoveryListener);
            }
            Thread.sleep(500);  // Wait a bit in case we just started the service
        }

        private List<DashboardURL> fetchPingURL() throws InterruptedException {
            discoverURL();
            if (mPingURL == null) {
                Log.e(TAG, "Unknown ping URL, cannot continue");
                return null;
            }

            try {
                Log.i(TAG, "Fetching ping URL url=" + mPingURL);
                URL url = new URL(mPingURL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setUseCaches(false);
                conn.setAllowUserInteraction(false);
                conn.setConnectTimeout(mTimeout);
                conn.setReadTimeout(mTimeout);
                conn.connect();
                int status = conn.getResponseCode();

                switch (status) {
                case 200:
                case 201:
                    BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line + "\n");
                    }
                    br.close();

                    JSONArray urls = new JSONArray(sb.toString());
                    List<DashboardURL> entries = new ArrayList<DashboardURL>(urls.length());
                    for (int i = 0; i < urls.length(); i++) {
                        DashboardURL entry = new DashboardURL(urls.getJSONObject(i));
                        entries.add(entry);
                    }
                    Log.d(TAG, "Got " + urls.length() + " urls");
                    return entries;
                }
            } catch (MalformedURLException ex) {
                Log.e(TAG, "Malformed URL url=" + mPingURL, ex);
            } catch (IOException ex) {
                Log.e(TAG, "Unable to retrieve ping URL", ex);
            } catch (JSONException ex) {
                Log.e(TAG, "Invalid JSON received", ex);
            }
            return null;
        }

        @Override
        public void run() {
            Log.d(TAG, "Background fetcher thread started");
            boolean running = true;
            while (running) {
                try {
                    List<DashboardURL> mURLs = null;

                    // Display loading animation
                    Message blankMessage = mHandler.obtainMessage(0, null);
                    blankMessage.sendToTarget();

                    // Fetch ping URL until we succeed
                    while (mURLs == null) {
                        mURLs = fetchPingURL();
                        if (mURLs == null) {
                            Log.i(TAG, "No URL to display, wait seconds=" + mSleep);
                            Thread.sleep(TimeUnit.MILLISECONDS.convert(mSleep,
                                                                       TimeUnit.SECONDS));
                        }
                    }

                    // Display each URL
                    for (DashboardURL url : mURLs) {
                        Message urlMessage = mHandler.obtainMessage(0, url);
                        Log.i(TAG, "Display url=" + url.getURL());
                        urlMessage.sendToTarget();
                        if (url.getDelay() == 0) {
                            Log.i(TAG, "URL url=" + url.getURL() + " should be displayed forever");
                            throw new InterruptedException();
                        }
                        Log.i(TAG, "And sleep for delay=" + url.getDelay());
                        Thread.sleep(TimeUnit.MILLISECONDS.convert(url.getDelay(),
                                                                   TimeUnit.SECONDS));
                    }

                } catch (InterruptedException e) {
                    Log.i(TAG, "Exit ping thread");
                    running = false;
                }
            }
            if (mDiscoveryListener != null) {
                mNsdManager.stopServiceDiscovery(mDiscoveryListener);
            }
        }

    }

}
