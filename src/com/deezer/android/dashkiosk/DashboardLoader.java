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
import android.os.Handler;
import android.os.Message;
import android.preference.PreferenceManager;
import android.util.Log;

import com.deezer.android.dashkiosk.DashboardPreferences;
import com.deezer.android.dashkiosk.DashboardURL;

/**
 * Load URLs from ping URL
 */
public class DashboardLoader {

    private static final String TAG = "DashKiosk";
    private String mPingURL;
    private Integer mTimeout;
    private Integer mSleep;
    private BackgroundThread mThread;
    private volatile long mLastRenderingTime = 0;

    private static Handler mHandler;

    public DashboardLoader(Context context, Handler handler) {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        mPingURL = sharedPref.getString("pref_ping_url", null);
        mTimeout = Integer.valueOf(sharedPref.getString("pref_ping_timeout", null));
        mSleep = Integer.valueOf(sharedPref.getString("pref_ping_sleep", null));
        mHandler = handler;
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

    public void setLastRenderingTime(long value) {
        mLastRenderingTime = value;
    }
    public long getLastRenderingTime() {
        return mLastRenderingTime;
    }

    private class BackgroundThread extends Thread {

        private List<DashboardURL> fetchPingURL() throws InterruptedException {
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
                        setLastRenderingTime(0);
                        Message urlMessage = mHandler.obtainMessage(0, url);
                        Log.i(TAG, "Display url=" + url.getURL());
                        urlMessage.sendToTarget();
                        Log.i(TAG, "And sleep for delay=" + url.getDelay());
                        Thread.sleep(TimeUnit.MILLISECONDS.convert(url.getDelay(),
                                                                   TimeUnit.SECONDS));
                        long additionalDelay = getLastRenderingTime();
                        if (additionalDelay > 0) {
                            Log.i(TAG, "Additional sleep delay=" + additionalDelay + " for rendering time");
                            Thread.sleep(additionalDelay);
                        }
                    }

                } catch (InterruptedException e) {
                    Log.i(TAG, "Exit ping thread");
                    running = false;
                }
            }
        }

    }

}
