package com.sannidhitirandas.sunny;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "SunnyFilePicker")
public class SunnyFilePickerPlugin extends Plugin {

    private static final long MAX_FILE_SIZE = 50L * 1024L * 1024L;

    @PluginMethod
    public void pickFile(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
        startActivityForResult(call, intent, "handlePickerResult");
    }

    @ActivityCallback
    private void handlePickerResult(PluginCall call, ActivityResult result) {
        if (call == null || result == null ||
                result.getResultCode() != Activity.RESULT_OK ||
                result.getData() == null ||
                result.getData().getData() == null) {
            if (call != null) {
                call.resolve(new JSObject().put("files", new JSArray()));
            }
            return;
        }

        Intent data = result.getData();
        Uri uri = data.getData();
        try {
            String name = getDisplayName(uri);
            String mimeType = getMimeType(uri, name);
            long size = getSize(uri);
            if (size > MAX_FILE_SIZE) {
                call.reject("File is larger than 50 MB");
                return;
            }
            byte[] bytes = readBytes(uri);
            if (bytes.length > MAX_FILE_SIZE) {
                call.reject("File is larger than 50 MB");
                return;
            }

            JSObject file = new JSObject();
            file.put("name", name);
            file.put("mimeType", mimeType);
            file.put("size", size > 0 ? size : bytes.length);
            file.put("data", Base64.encodeToString(bytes, Base64.NO_WRAP));

            JSArray files = new JSArray();
            files.put(file);

            JSObject response = new JSObject();
            response.put("files", files);
            call.resolve(response);
        } catch (Exception e) {
            String detail = e.getMessage();
            call.reject(detail == null || detail.isEmpty()
                    ? "Unable to read selected file"
                    : "Unable to read selected file: " + detail);
        }
    }

    private String getDisplayName(Uri uri) {
        Cursor cursor = getContext().getContentResolver().query(
                uri,
                new String[]{OpenableColumns.DISPLAY_NAME},
                null,
                null,
                null
        );
        if (cursor != null) {
            try {
                if (cursor.moveToFirst()) {
                    int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (index >= 0) return cursor.getString(index);
                }
            } finally {
                cursor.close();
            }
        }
        String path = uri.getPath();
        return path == null ? "attachment" : path.substring(path.lastIndexOf('/') + 1);
    }

    private long getSize(Uri uri) {
        Cursor cursor = getContext().getContentResolver().query(
                uri,
                new String[]{OpenableColumns.SIZE},
                null,
                null,
                null
        );
        if (cursor != null) {
            try {
                if (cursor.moveToFirst()) {
                    int index = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (index >= 0 && !cursor.isNull(index)) return cursor.getLong(index);
                }
            } finally {
                cursor.close();
            }
        }
        return -1;
    }

    private String getMimeType(Uri uri, String name) {
        String mimeType = getContext().getContentResolver().getType(uri);
        if (mimeType != null && !mimeType.isEmpty() && !"application/octet-stream".equalsIgnoreCase(mimeType)) {
            return mimeType;
        }

        int dot = name.lastIndexOf('.');
        String extension = dot >= 0 ? name.substring(dot + 1).toLowerCase() : "";
        switch (extension) {
            case "pdf": return "application/pdf";
            case "doc": return "application/msword";
            case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "txt": return "text/plain";
            case "csv": return "text/csv";
            case "json": return "application/json";
            case "md": return "text/markdown";
            case "xls": return "application/vnd.ms-excel";
            case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            default:
                String mapped = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
                return mapped == null ? "application/octet-stream" : mapped;
        }
    }

    private byte[] readBytes(Uri uri) throws Exception {
        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("Could not open selected file");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            return output.toByteArray();
        }
    }
}
