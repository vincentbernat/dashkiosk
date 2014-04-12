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
    private boolean mReady = false;

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
        final Runnable show = new Runnable() {
                @Override
                public void run() {
                    View rootView = ((Activity)mContext).getWindow().getDecorView().findViewById(android.R.id.content);
                    View im = rootView.findViewById(R.id.image);
                    im.setVisibility(View.GONE);
                }
            };
        /* And another interface to signal we are trying to reload the
         * web app. If the app is not ready after the timeout, force a
         * full reload. */
        final Runnable reload = new Runnable() {
                @Override
                public void run() {
                    reloadIfNotReady();
                }
            };
        this.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void ready() {
                    Log.i(TAG, "Web page tells it is ready");
                    mReady = true;
                    handler.post(show);
                }

                @JavascriptInterface
                public void reload() {
                    Log.i(TAG, "Web page is requesting a reload");
                    mReady = false;
                    handler.post(reload);
                }
            }, "JSInterface");

        this.load();
    }

    /* Load the application */
    private void reloadIfNotReady() {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(mContext);
        final String pingURL = sharedPref.getString("pref_ping_url", null);
        int timeout = Integer.valueOf(sharedPref.getString("pref_ping_timeout", null));

        final Handler handler = new Handler();
        Runnable reload = new Runnable() {
            @Override
            public void run() {
                if (!mReady) {
                    Log.i(TAG, "Unable to load " + pingURL + ". Let's retry");
                    View rootView = ((Activity)mContext).getWindow().getDecorView().findViewById(android.R.id.content);
                    View im = rootView.findViewById(R.id.image);
                    im.setVisibility(View.VISIBLE);
                    stopLoading();
                    load();
                }
            }
        };
        handler.postDelayed(reload, timeout);
    }

    private void load() {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(mContext);
        final String pingURL = sharedPref.getString("pref_ping_url", null);
        this.reloadIfNotReady();
        this.loadUrl(pingURL);
        mReady = false;
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
