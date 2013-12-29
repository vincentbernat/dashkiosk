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

import android.app.Activity;
import android.app.LoaderManager;
import android.content.Loader;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import com.deezer.android.dashkiosk.DashboardWebView;
import com.deezer.android.dashkiosk.DashboardLoader;
import com.deezer.android.dashkiosk.DashboardURL;

public class DashboardActivity extends Activity {

    private static final String TAG = "DashKiosk";
    private DashboardLoader mLoader;

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
    }

    @Override
    public void onStart() {
        super.onStart();

        Handler mHandler;
        if (mLoader == null) {
            mHandler = new Handler() {
                    @Override
                    public void handleMessage(Message msg) {
                        DashboardURL url = (DashboardURL) msg.obj;
                        // Load the invisible webview
                        DashboardWebView wv1 = (DashboardWebView) findViewById(R.id.webview1);
                        DashboardWebView wv2 = (DashboardWebView) findViewById(R.id.webview2);
                        DashboardWebView wv = (wv1.getVisibility() == View.VISIBLE)?wv2:wv1;
                        hideNavigationBar();
                        wv.loadUrl(url);
                    }
                };
            mLoader = new DashboardLoader(getApplication(), mHandler);
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
