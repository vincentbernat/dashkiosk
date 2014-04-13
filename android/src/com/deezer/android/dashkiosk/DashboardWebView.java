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
import android.os.Message;
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
    private static final int ALIVE = 1;
    private static final int DEADLINE = 2;
    private Context mContext;
    private Handler mHandler = null;

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
        this.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void ready() {
                    mHandler.sendMessage(mHandler.obtainMessage(ALIVE));
                }

                @JavascriptInterface
                public int timeout() {
                    return getTimeout();
                }
            }, "JSInterface");

        this.heartbeat();
        this.load();
    }

    // Trigger a reload if we miss an heartbeat
    private void heartbeat() {
        View rootView = ((Activity)mContext).getWindow()
            .getDecorView().findViewById(android.R.id.content);
        final View image = rootView.findViewById(R.id.image);
        this.mHandler = new Handler() {
                @Override
                public void handleMessage(Message input) {
                    switch (input.what) {
                    case ALIVE:
                        // Got a heartbeat, delay deadline
                        Log.d(TAG, "Received heartbeat");
                        image.setVisibility(View.GONE);
                        mHandler.removeMessages(DEADLINE);
                        mHandler.sendMessageDelayed(mHandler.obtainMessage(DEADLINE),
                                                    getTimeout());
                        break;
                    case DEADLINE:
                        // We hit the deadline, trigger a reload
                        Log.i(TAG, "No activity from supervised URL. Trigger reload.");
                        image.setVisibility(View.VISIBLE);
                        stopLoading();
                        load();
                        break;
                    }
                }
            };

        mHandler.sendMessageDelayed(mHandler.obtainMessage(DEADLINE),
                                    getTimeout());
    }

    private void load() {
        SharedPreferences sharedPref = PreferenceManager
            .getDefaultSharedPreferences(mContext);
        final String pingURL = sharedPref.getString("pref_ping_url", null);
        this.loadUrl(pingURL);
    }

    private int getTimeout() {
        SharedPreferences sharedPref = PreferenceManager
            .getDefaultSharedPreferences(mContext);
        return Integer.valueOf(sharedPref.getString("pref_ping_timeout", null));
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
