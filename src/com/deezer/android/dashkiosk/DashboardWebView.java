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
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

/**
 * Fullscreen web view that is setup for kiosk mode: no interaction
 * allowed. Moreover, a loading screen is used while we wait for
 * another URL to load.
 */
public class DashboardWebView extends WebView {

    public DashboardWebView(Context context) {
        super(context);
    }
    public DashboardWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }
    public DashboardWebView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
    }

    /**
     * When loading an "empty" URL, just display the loading page.
     */
    public void loadUrl(String url) {
        if (url.equals("about:blank")) {
            super.loadUrl("file:///android_asset/html/loading.html");
        } else {
            super.loadUrl(url);
        }
    }

    @Override
    protected void onAttachedToWindow() {
        WebSettings ws = this.getSettings();
        ws.setJavaScriptEnabled(true);

        this.loadUrl("about:blank");
        this.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    return true;
                }
                public boolean shouldOverrideKeyEvent(WebView view, KeyEvent event) {
                    return true;
                }
            });
    }
}
