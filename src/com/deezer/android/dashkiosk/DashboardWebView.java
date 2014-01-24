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
import java.util.concurrent.TimeUnit;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Bitmap;
import android.graphics.Rect;
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

    /**
     * Callback interface when a page is loaded.
     */
    public interface PageLoadedCallback {
        void onPageLoaded(DashboardURL url, long elapsed);
    }

    private static final String TAG = "DashKiosk";
    private Timer mScroll;            // Timer to handle scrolling
    private float mScale = 1.0f;      // Current scale
    private DashboardURL mCurrentURL; // Current URL
    private PageLoadedCallback mPageLoadedCb; // Callback when a page is loaded

    public DashboardWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    /**
     * When loading an "empty" URL, just display the loading
     * page. Also record the current URL when we have one and register
     * the "on loaded" callback if any.
     */
    @Override
    public void loadUrl(String url) {
        loadUrl(url, (PageLoadedCallback)null);
    }
    public void loadUrl(String url, PageLoadedCallback cb) {
        cancelScrolling();
        mPageLoadedCb = cb;
        if (url == null || url.equals("about:blank")) {
            mCurrentURL = null;
            Log.d(TAG, "Display loading page");
            super.loadUrl("file:///android_asset/html/loading.html");
        } else {
            Log.d(TAG, "Display url=" + url);
            super.loadUrl(url);
        }
    }
    public void loadUrl(DashboardURL url) {
        loadUrl(url, (PageLoadedCallback)null);
    }
    public void loadUrl(DashboardURL url, PageLoadedCallback cb) {
        mCurrentURL = url;
        loadUrl((url != null)?url.getURL():(String)null, cb);
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
        if (mCurrentURL != null &&
            mCurrentURL.getScroll() &&
            mCurrentURL.getDelay() > 0) {
            int page_height = (int) Math.floor(getContentHeight() * mScale);
            final int view_height = getHeight();
            if (view_height == 0) return;
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
                long delay = TimeUnit.MILLISECONDS.convert(mCurrentURL.getDelay(),
                                                           TimeUnit.SECONDS) / (steps+1);
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
    protected void onFocusChanged(boolean gainFocus, int direction, Rect previouslyFocusedRect) {
        if (gainFocus) {
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

                private long mStarted;

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    DashboardWebView v = (DashboardWebView) view;
                    v.loadUrl(url, mPageLoadedCb);
                    return true;
                }
                @Override
                public boolean shouldOverrideKeyEvent(WebView view, KeyEvent event) {
                    return true;
                }
                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    cancelScrolling();
                    mStarted = System.nanoTime();
                }
                @Override
                public void onScaleChanged(WebView view, float oldScale, float newScale) {
                    mScale = newScale;
                    startScrolling();
                }
                @Override
                public void onPageFinished(WebView view, String url) {
                    cancelScrolling(); //  Just in case

                    if (mPageLoadedCb != null) {
                        long mElapsed = TimeUnit.MILLISECONDS.convert(
                            System.nanoTime() - mStarted,
                            TimeUnit.NANOSECONDS);
                        mPageLoadedCb.onPageLoaded(mCurrentURL, mElapsed);
                        mPageLoadedCb = null;
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
