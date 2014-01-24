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
import java.io.PrintWriter;

import android.app.Activity;
import android.app.LoaderManager;
import android.content.Loader;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.preference.PreferenceManager;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentPagerAdapter;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.Fragment;
import android.support.v4.view.ViewPager;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import com.deezer.android.dashkiosk.DashboardWebView;
import com.deezer.android.dashkiosk.DashboardLoader;
import com.deezer.android.dashkiosk.DashboardURL;

public class DashboardActivity extends FragmentActivity {

    private static final String TAG = "DashKiosk";

    /**
     * Hide navigation bar. Not permanent.
     */
    private void hideNavigationBar() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
    }

    /**
     * Set orientation.
     */
    private void setOrientation() {
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplication());
        String orientation = sharedPref.getString("pref_general_orientation", null);
        if (orientation.equals("LANDSCAPE")) {
            Log.i(TAG, "Forcing orientation to landscape");
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        } else if (orientation.equals("PORTRAIT")) {
            Log.i(TAG, "Forcing orientation to portrait");
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else if (orientation.equals("AUTOMATIC")) {
            Log.i(TAG, "Automatic orientation");
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR);
        } else {
            Log.i(TAG, "No orientation change");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.i(TAG, "Main activity created");
        PreferenceManager.setDefaultValues(this, R.xml.preferences, true);
        setOrientation();
        hideNavigationBar();
        setContentView(R.layout.main);

        Dashboard fragment = new Dashboard();
        getSupportFragmentManager().beginTransaction()
            .add(R.id.container, fragment).commit();
    }

    public static class Dashboard extends Fragment {

        private WebViewAdapter mAdapter;
        private DashboardLoader mLoader;
        private ViewPager mViewPager;

        @Override
        public View onCreateView(LayoutInflater inflater, ViewGroup container,
                                 Bundle savedInstanceState) {
            mAdapter = new WebViewAdapter(getFragmentManager());
            mViewPager = (ViewPager) inflater.inflate(R.layout.pager, container, false);
            mViewPager.setAdapter(mAdapter);
            mViewPager.setCurrentItem(0);
            return mViewPager;
        }

        /**
         * Load an URL
         */
        private void loadUrl(DashboardURL url, DashboardWebView.PageLoadedCallback cb) {
            // Load in the invisible webview
            DashboardWebView first = (DashboardWebView) mViewPager.findViewWithTag("webview#0");
            DashboardWebView second = (DashboardWebView) mViewPager.findViewWithTag("webview#1");
            DashboardWebView focused = (first.hasFocus())?second:first;
            /* Stop loading anything if we have something to load... */
            first.stopLoading();
            second.stopLoading();
            /* And load the new URL */
            focused.loadUrl(url, cb);
        }

        public void onReady() {
            Handler mHandler;
            if (mLoader == null && mViewPager.getChildCount() == 2) {
                Log.d(TAG, "Starting loader");
                mHandler = new Handler() {
                        @Override
                        public void handleMessage(Message msg) {
                            DashboardURL url = (DashboardURL) msg.obj;
                            DashboardActivity activity = (DashboardActivity) getActivity();
                            activity.hideNavigationBar();
                            loadUrl(url, new DashboardWebView.PageLoadedCallback() {
                                    @Override
                                    public void onPageLoaded(DashboardURL url, long elapsed) {
                                        DashboardWebView first = (DashboardWebView) mViewPager.findViewWithTag("webview#0");
                                        DashboardWebView second = (DashboardWebView) mViewPager.findViewWithTag("webview#1");
                                        int unfocused = (first.hasFocus())?1:0;
                                        Log.d(TAG, "Transition to page #" + unfocused);
                                        mViewPager.setCurrentItem(unfocused, true);
                                        mLoader.setLastRenderingTime(elapsed);
                                    }
                                });
                        }
                    };
                mLoader = new DashboardLoader(getActivity().getApplication(), mHandler);
                mLoader.start();
            }
        }


        @Override
        public void onStop() {
            super.onStop();
            if (mLoader != null) {
                mLoader.stop();
                mLoader = null;
            }
        }
    }

    public static class WebViewAdapter extends FragmentPagerAdapter {

        public WebViewAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public int getCount() {
            return 2;
        }

        @Override
        public Fragment getItem(int position) {
            Log.d(TAG, "Creating webview #" + position);
            return new WebViewFragment(position);
        }

    }

    public static class WebViewFragment extends Fragment {

        private int mPosition;

        public WebViewFragment(int position) {
            super();
            mPosition = position;
        }

        @Override
        public View onCreateView(LayoutInflater inflater, ViewGroup container,
                                 Bundle SavedInstanceState) {
            View v = inflater.inflate(R.layout.webview, container, false);
            v.setTag("webview#" + mPosition);
            return v;
        }

        @Override
        public void onStart() {
            super.onStart();
            Dashboard d = (Dashboard) getActivity()
                .getSupportFragmentManager()
                .findFragmentById(R.id.container);
            d.onReady();
        }
    }
}
