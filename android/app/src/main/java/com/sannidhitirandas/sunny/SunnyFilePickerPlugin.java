package com.sannidhitirandas.sunny;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import java.io.File;
import java.io.FileOutputStream;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.InputStream;

@CapacitorPlugin(name = "SunnyFilePicker")
public class SunnyFilePickerPlugin extends Plugin {

    private static final long MAX_FILE_SIZE = 50L * 1024L * 1024L;

    @PluginMethod
    public void pickFile(PluginCall call) {
        Log.e("SunnyFilePicker", "pickFile() called");
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
        Log.e("SunnyFilePicker", "launching ACTION_OPEN_DOCUMENT");
        startActivityForResult(call, intent, "handlePickerResult");
    }

    @ActivityCallback
    private void handlePickerResult(PluginCall call, ActivityResult result) {
        Log.e("SunnyFilePicker", "handlePickerResult() called; call=" + (call != null) + ", result=" + (result != null));
        if (call == null || result == null ||
                result.getResultCode() != Activity.RESULT_OK ||
                result.getData() == null ||
                result.getData().getData() == null) {
            if (call != null) {
                call.resolve(new JSObject().put("files", new JSArray()));
            }
            return;
        }

        Uri uri = result.getData().getData();
        try {
            String name = getDisplayName(uri);
            String mimeType = getMimeType(uri, name);
            long size = getSize(uri);

            if (size > MAX_FILE_SIZE) {
                call.reject("File is larger than 50 MB");
                return;
            }

            File cachedFile = copyToCache(uri, name);
            long cachedSize = cachedFile.length();

            if (cachedSize > MAX_FILE_SIZE) {
                //noinspection ResultOfMethodCallIgnored
                cachedFile.delete();
                call.reject("File is larger than 50 MB");
                return;
            }

            JSObject file = new JSObject();
            file.put("name", name);
            file.put("mimeType", mimeType);
            file.put("size", size > 0 ? size : cachedSize);
            file.put("path", Uri.fromFile(cachedFile).toString());

            JSArray files = new JSArray();
            files.put(file);

            JSObject response = new JSObject();
            response.put("files", files);

            Log.e("SunnyFilePicker", "file cached; bytes=" + cachedSize + ", mime=" + mimeType + ", name=" + name);
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
        String rawPath = call.getString("path");
        if (rawPath == null || rawPath.trim().isEmpty()) {
            call.reject("File path is required");
            return;
        }

        File file;
        try {
            Uri fileUri = Uri.parse(rawPath);
            String filePath = fileUri.getPath();
            if (filePath == null || filePath.trim().isEmpty()) {
                call.reject("Invalid cached file path");
                return;
            }
            file = new File(filePath);
        } catch (Exception error) {
            call.reject("Invalid cached file path");
            return;
        }
        File cacheDir = getContext().getCacheDir();
        String cachePrefix = new File(cacheDir, "sunny-picker-").getAbsolutePath();

        if (file.getAbsolutePath() == null || !file.getAbsolutePath().startsWith(cachePrefix)) {
            call.reject("Invalid cached file path");
            return;
        }

        if (file.exists() && !file.delete()) {
            call.reject("Could not remove cached file");
            return;
        }

        call.resolve();
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
        // pickFile has no meaningful options to persist. Returning a non-null
        // bundle lets Capacitor persist the pending activity callback across
        // the Android document-picker lifecycle without trying to serialize
        // the original call from a recreated plugin instance.
        return new Bundle();
    }

    private File copyToCache(Uri uri, String name) throws Exception {
        String extension = "";
        int dot = name.lastIndexOf('.');
        if (dot >= 0 && dot < name.length() - 1) {
            extension = name.substring(dot);
        }

        File cacheFile = File.createTempFile("sunny-picker-", extension, getContext().getCacheDir());

        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             FileOutputStream output = new FileOutputStream(cacheFile)) {
            if (input == null) throw new IllegalStateException("Could not open selected file");

            byte[] buffer = new byte[8192];
            long total = 0;
            int read;
            while ((read = input.read(buffer)) != -1) {
                total += read;
                if (total > MAX_FILE_SIZE) {
                    //noinspection ResultOfMethodCallIgnored
                    cacheFile.delete();
                    throw new IllegalStateException("File is larger than 50 MB");
                }
                output.write(buffer, 0, read);
            }
        } catch (Exception error) {
            //noinspection ResultOfMethodCallIgnored
            cacheFile.delete();
            throw error;
        }

        return cacheFile;
    }
}
