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

import java.util.*;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Bitmap;
import android.util.AttributeSet;
import android.util.Log;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

import com.deezer.android.dashkiosk.DashboardURL;

/**
 * Fullscreen web view that is setup for kiosk mode: no interaction
 * allowed. Moreover, a loading screen is used while we wait for
 * another URL to load.
 */
public class DashboardWebView extends WebView {

    private static final String TAG = "DashKiosk";
    private int swapWithId;
    private DashboardURL currentURL;
    private Timer mScroll;

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
    @Override
    public void loadUrl(String url) {
        cancelScrolling();
        if (url == null || url.equals("about:blank")) {
            Log.d(TAG, "Display loading page");
            currentURL = null;
            super.loadUrl("file:///android_asset/html/loading.html");
        } else {
            Log.d(TAG, "Display url=" + url);
            super.loadUrl(url);
        }
    }
    public void loadUrl(DashboardURL url) {
        if (url == null) {
            loadUrl("about:blank");
            return;
        }
        currentURL = url;
        loadUrl(url.getURL());
    }

    /**
     * Cancel current programmed scrolling.
     */
    private synchronized void cancelScrolling() {
        if (mScroll != null) {
            mScroll.cancel();
            mScroll = null;
        }
    }

    /**
     * Start to scroll the page.
     *
     * This function needs to be called once the page is correctly
     * rendered. However, this is quite hard to find when. Therefore,
     * we call it when:
     *  - the view is displayed
     *  - the scale has changed
     *
     * The best place to call this function is when the scale is
     * changing but it is quite possible to get two successive pages
     * whose scale does not change...
     */
    private void startScrolling() {
        cancelScrolling();
        if (currentURL != null &&
            currentURL.getScroll() &&
            currentURL.getDelay() > 0) {
            int page_height = (int) Math.floor(getContentHeight() * getScale());
            final int view_height = getHeight();
            final int steps = page_height / view_height -
                ((page_height % view_height < 100) ? 1 : 0);
            // When the page height is a multiple of the
            // view_height, we need to remove one step. We
            // use a small margin to avoid useless scroll.
            Log.d(TAG,
                  "View is height="   + view_height +
                  "; page is height=" + page_height +
                  "; we need steps="  + steps);
            if (steps > 0) {
                int delay = currentURL.getDelay() * 1000 / (steps+1);
                mScroll = new Timer();
                mScroll.scheduleAtFixedRate(new TimerTask() {
                        private int remainingSteps;
                            {
                                remainingSteps = steps;
                            }

                        @Override
                        public void run() {
                            scrollBy(0, view_height);
                            remainingSteps--;
                            if (remainingSteps == 0) {
                                cancelScrolling();
                            }
                        }
                    }, delay + 1, delay + 1);
            }
        }
    }

    @Override
    protected void onVisibilityChanged(View changedView, int visibility) {
        if (changedView == this &&
            visibility == View.VISIBLE) {
            startScrolling();
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
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    cancelScrolling();
                }
                @Override
                public void onScaleChanged(WebView view, float oldScale, float newScale) {
                    startScrolling();
                }
                @Override
                public void onPageFinished(WebView view, String url) {
                    cancelScrolling(); //  Just in case

                    // Swap with the other webview
                    if (swapWithId != 0) {
                        View other = getRootView().findViewById(swapWithId);
                        if (other != null) {
                            Log.d(TAG, "New page ready, swap with old page");
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
