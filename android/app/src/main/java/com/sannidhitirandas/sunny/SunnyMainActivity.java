package com.sannidhitirandas.sunny;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class SunnyMainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SunnyFilePickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
