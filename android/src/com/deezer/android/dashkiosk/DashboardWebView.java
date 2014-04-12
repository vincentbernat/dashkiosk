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

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.preference.PreferenceManager;
import android.util.AttributeSet;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

/**
 * Fullscreen web view that is setup for kiosk mode: no interaction
 * allowed.
 */
public class DashboardWebView extends WebView {

    private static final String TAG = "DashKiosk";
    private Context mContext;
    private long lastAlive;     // Last time the webpage was alive

    public DashboardWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        mContext = context;
    }

    @SuppressWarnings("deprecation")
    private void enableLocalStorage() {
        WebSettings ws = this.getSettings();
        ws.setDatabaseEnabled(true);
        ws.setDatabasePath(mContext.getApplicationContext().getDir("databases", Context.MODE_PRIVATE).getPath());
        ws.setDomStorageEnabled(true);
    }

    @Override
    protected void onAttachedToWindow() {
        WebSettings ws = this.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        enableLocalStorage();

        /* No interaction */
        this.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideKeyEvent(WebView view, KeyEvent event) {
                    return true;
                }
            });

        /* Log Javascript stuff */
        this.setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onConsoleMessage(ConsoleMessage cm) {
                    Log.d(TAG, "Javascript log (" + cm.sourceId() + ":" +
                          cm.lineNumber() + "): " + cm.message());
                    return true;
                }
            });

        /* Provide an interface for readiness */
        final Handler handler = new Handler();
        final Runnable alive = new Runnable() {
                @Override
                public void run() {
                    // Signal that the webapp is alive: display it and reset lastAlive counter
                    View rootView = ((Activity)mContext).getWindow().getDecorView().findViewById(android.R.id.content);
                    View im = rootView.findViewById(R.id.image);
                    im.setVisibility(View.GONE);
                    lastAlive = System.nanoTime();
                }
            };
        this.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void ready() {
                    Log.i(TAG, "Web page tells it is ready");
                    handler.post(alive);
                }

                @JavascriptInterface
                public int timeout() {
                    SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(mContext);
                    int timeout = Integer.valueOf(sharedPref.getString("pref_ping_timeout", null));
                    return timeout;
                }
            }, "JSInterface");

        this.load();
    }

    /* If the application doesn't heartbeat after the timeout, trigger a reload */
    private void reloadIfNotAlive() {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(mContext);
        final String pingURL = sharedPref.getString("pref_ping_url", null);
        final int timeout = Integer.valueOf(sharedPref.getString("pref_ping_timeout", null));

        final Handler handler = new Handler();
        Runnable reload = new Runnable() {
                @Override
                public void run() {
                    long delta = (System.nanoTime() - lastAlive) / 1000000;
                    if (delta >= timeout) {
                        // We didn't receive an hearbeat in time
                        Log.i(TAG, "No activity from " + pingURL +
                              " since " + delta + "ms (timeout: " + timeout + "). Let's retry");
                        View rootView = ((Activity)mContext).getWindow().getDecorView().findViewById(android.R.id.content);
                        View im = rootView.findViewById(R.id.image);
                        im.setVisibility(View.VISIBLE);
                        stopLoading();
                        load();
                    } else {
                        // OK, we got the heartbeat but we still have to watch.
                        reloadIfNotAlive();
                    }
                }
            };

        // Check in `timeout` ms if we got the heartbeat.
        handler.postDelayed(reload, timeout + 1000);
    }

    private void load() {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(mContext);
        final String pingURL = sharedPref.getString("pref_ping_url", null);
        this.reloadIfNotAlive();
        this.loadUrl(pingURL);
    }

    // More events disabled
    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        return true;
    }
    @Override
    public boolean onHoverEvent(MotionEvent event) {
        return true;
    }
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        return true;
    }
    @Override
    public boolean onTrackballEvent(MotionEvent event) {
        return true;
    }

}
