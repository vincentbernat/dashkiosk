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

import android.content.Context;
import android.content.res.TypedArray;
import android.util.AttributeSet;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

/**
 * Fullscreen web view that is setup for kiosk mode: no interaction
 * allowed. Moreover, a loading screen is used while we wait for
 * another URL to load.
 */
public class DashboardWebView extends WebView {

    private static final String TAG = "DashKiosk";
    private int swapWithId;

    public DashboardWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        TypedArray a = context.getTheme().obtainStyledAttributes(
            attrs, R.styleable.DashboardWebView,
            0, 0);
        try {
            swapWithId = a.getResourceId(R.styleable.DashboardWebView_swapWith, 0);
        } finally {
            a.recycle();
        }
    }

    /**
     * When loading an "empty" URL, just display the loading page.
     */
    public void loadUrl(String url) {
        if (url == null || url.equals("about:blank")) {
            Log.d(TAG, "Display loading page");
            super.loadUrl("file:///android_asset/html/loading.html");
        } else {
            Log.d(TAG, "Display url=" + url);
            super.loadUrl(url);
        }
    }

    @Override
    protected void onAttachedToWindow() {
        WebSettings ws = this.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);

        this.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    view.loadUrl(url);
                    return true;
                }
                @Override
                public boolean shouldOverrideKeyEvent(WebView view, KeyEvent event) {
                    return true;
                }
                @Override
                public void onPageFinished(WebView view, String url) {
                    // Swap with the other webview
                    if (swapWithId != 0) {
                        View other = getRootView().findViewById(swapWithId);
                        if (other != null) {
                            Log.d(TAG, "New page reasdy, swap with old page");
                            other.setVisibility(View.GONE);
                            view.setVisibility(View.VISIBLE);
                        }
                    }
                }
            });
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
