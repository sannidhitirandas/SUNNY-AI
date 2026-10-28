package com.sannidhitirandas.sunny;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private ValueCallback<Uri[]> mUploadMessage;
    private final static int FILE_CHOOSER_RESULT_CODE = 2000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SunnyFilePickerPlugin.class);
        super.onCreate(savedInstanceState);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
                @Override
                public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                    if (mUploadMessage != null) {
                        mUploadMessage.onReceiveValue(null);
                    }
                    mUploadMessage = filePathCallback;

                    try {
                        Intent intent = fileChooserParams.createIntent();
                        startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                    } catch (Exception e) {
                        mUploadMessage = null;
                        return false;
                    }
                    return true;
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (mUploadMessage == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            mUploadMessage.onReceiveValue(results);
            mUploadMessage = null;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }
}
