package com.sannidhitirandas.sunny;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Log;
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
        Log.d("SunnyFilePicker", "pickFile() called");
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        startActivityForResult(call, intent, "handlePickerResult");
    }

    @ActivityCallback
    private void handlePickerResult(PluginCall call, ActivityResult result) {
        Log.d("SunnyFilePicker", "handlePickerResult() called; call=" + (call != null) + ", result=" + (result != null));
        if (call == null || result == null ||
                result.getResultCode() != Activity.RESULT_OK ||
                result.getData() == null) {
            if (call != null) {
                call.resolve(new JSObject().put("files", new JSArray()));
            }
            return;
        }

        Intent dataIntent = result.getData();
        JSArray files = new JSArray();

        try {
            if (dataIntent.getClipData() != null) {
                ClipData clipData = dataIntent.getClipData();
                for (int i = 0; i < clipData.getItemCount(); i++) {
                    Uri uri = clipData.getItemAt(i).getUri();
                    if (uri != null) {
                        JSObject fileObj = processUri(uri);
                        if (fileObj != null) {
                            files.put(fileObj);
                        }
                    }
                }
            } else if (dataIntent.getData() != null) {
                Uri uri = dataIntent.getData();
                JSObject fileObj = processUri(uri);
                if (fileObj != null) {
                    files.put(fileObj);
                }
            }

            JSObject response = new JSObject();
            response.put("files", files);
            Log.d("SunnyFilePicker", "pickFile resolved with " + files.length() + " files");
            call.resolve(response);
        } catch (Exception e) {
            Log.e("SunnyFilePicker", "picker callback failed", e);
            String detail = e.getMessage();
            call.reject(detail == null || detail.isEmpty()
                    ? "Unable to read selected file"
                    : "Unable to read selected file: " + detail);
        }
    }

    @PluginMethod
    public void releaseFile(PluginCall call) {
        call.resolve();
    }

    private JSObject processUri(Uri uri) throws Exception {
        String name = getDisplayName(uri);
        String mimeType = getMimeType(uri, name);
        long size = getSize(uri);

        if (size > MAX_FILE_SIZE) {
            throw new IllegalStateException("File is larger than 50 MB");
        }

        byte[] fileBytes = readFileBytes(uri);
        if (fileBytes.length > MAX_FILE_SIZE) {
            throw new IllegalStateException("File is larger than 50 MB");
        }

        String base64Data = Base64.encodeToString(fileBytes, Base64.NO_WRAP);

        JSObject file = new JSObject();
        file.put("name", name);
        file.put("mimeType", mimeType);
        file.put("size", size > 0 ? size : fileBytes.length);
        file.put("data", base64Data);
        file.put("path", "");
        return file;
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
                    if (index >= 0) {
                        String value = cursor.getString(index);
                        if (value != null && !value.trim().isEmpty()) return value;
                    }
                }
            } finally {
                cursor.close();
            }
        }

        String rawPath = uri.getPath();
        if (rawPath == null || rawPath.isEmpty()) return "attachment";
        int slash = rawPath.lastIndexOf('/');
        return slash >= 0 ? rawPath.substring(slash + 1) : rawPath;
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

    @Override
    protected Bundle saveInstanceState() {
        return new Bundle();
    }

    private byte[] readFileBytes(Uri uri) throws Exception {
        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("Could not open selected file");

            byte[] data = new byte[16384];
            int nRead;
            long total = 0;
            while ((nRead = input.read(data, 0, data.length)) != -1) {
                total += nRead;
                if (total > MAX_FILE_SIZE) {
                    throw new IllegalStateException("File is larger than 50 MB");
                }
                buffer.write(data, 0, nRead);
            }
            buffer.flush();
            return buffer.toByteArray();
        }
    }
}
