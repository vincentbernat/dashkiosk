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

import org.json.*;

/**
 * An URL to be displayed with various parameters.
 */
public class DashboardURL {

    private String mURL;        // URL to be loaded
    private Integer mDelay = 600; // How long the URL should be loaded (in seconds)
    private Boolean mScroll = false; // Should we scroll the page?

    /**
     * Build an URL from a JSON object.
     */
    public DashboardURL(JSONObject json) throws JSONException {
        mURL = json.getString("url");
        try {
            Integer d = json.getInt("delay");
            if (mDelay > 0) {
                mDelay = d;
            }
        } catch (JSONException ex) {}
        try {
            mScroll = json.getBoolean("scroll");
        } catch (JSONException ex) {}
    }

    public String getURL() {
        return mURL;
    }

    public Integer getDelay() {
        return mDelay;
    }

    public Boolean getScroll() {
        return mScroll;
    }

}
