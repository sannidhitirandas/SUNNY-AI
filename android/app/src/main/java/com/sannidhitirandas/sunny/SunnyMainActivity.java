package com.sannidhitirandas.sunny;

import com.getcapacitor.BridgeActivity;

public class SunnyMainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(SunnyFilePickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
