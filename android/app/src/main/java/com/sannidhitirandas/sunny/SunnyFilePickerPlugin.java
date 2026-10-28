package com.sannidhitirandas.sunny;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
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
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "SunnyFilePicker")
public class SunnyFilePickerPlugin extends Plugin {

    private static final String TAG = "SunnyFilePicker";
    private static final long MAX_FILE_SIZE = 50L * 1024L * 1024L; // 50 MB

    @PluginMethod
    public void pickFile(PluginCall call) {
        Log.d(TAG, "pickFile() called");
        try {
            cleanupTempFiles();

            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            intent.putExtra(Intent.EXTRA_LOCAL_ONLY, false);

            Intent chooser = Intent.createChooser(intent, "Select File");
            startActivityForResult(call, chooser, "handlePickerResult");
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch ACTION_GET_CONTENT file picker intent, trying ACTION_OPEN_DOCUMENT", e);
            try {
                Intent docIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                docIntent.addCategory(Intent.CATEGORY_OPENABLE);
                docIntent.setType("*/*");
                docIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                startActivityForResult(call, docIntent, "handlePickerResult");
            } catch (Exception ex) {
                Log.e(TAG, "Failed to launch fallback file picker intent", ex);
                call.reject("Unable to open Android file picker: " + ex.getMessage());
            }
        }
    }

    @ActivityCallback
    public void handlePickerResult(PluginCall call, ActivityResult result) {
        Log.d(TAG, "handlePickerResult() called; call=" + (call != null) + ", result=" + (result != null));
        if (call == null) {
            Log.e(TAG, "Picker callback received no PluginCall");
            return;
        }
        if (result == null) {
            call.resolve(new JSObject().put("files", new JSArray()));
            return;
        }
        if (result.getResultCode() != Activity.RESULT_OK) {
            Log.d(TAG, "Picker result not OK (user likely cancelled)");
            call.resolve(new JSObject().put("files", new JSArray()));
            return;
        }
        if (result.getData() == null) {
            Log.w(TAG, "Picker returned RESULT_OK but no Intent data");
            call.resolve(new JSObject().put("files", new JSArray()));
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
                        try {
                            JSObject fileObj = processUri(uri);
                            if (fileObj != null) {
                                files.put(fileObj);
                            }
                        } catch (Exception ex) {
                            Log.e(TAG, "Failed to process clip item uri: " + uri, ex);
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
            Log.d(TAG, "pickFile resolved with " + files.length() + " files");
            call.resolve(response);
        } catch (Exception e) {
            Log.e(TAG, "picker callback failed", e);
            String detail = e.getMessage();
            call.reject(detail == null || detail.isEmpty()
                    ? "Unable to read selected file"
                    : "Unable to read selected file: " + detail);
        }
    }

    @PluginMethod
    public void releaseFile(PluginCall call) {
        String path = call.getString("path");
        if (path != null && !path.isEmpty()) {
            try {
                File file = new File(path);
                File cacheDir = getContext().getCacheDir();
                if (file.exists() && file.getAbsolutePath().startsWith(cacheDir.getAbsolutePath())) {
                    boolean deleted = file.delete();
                    Log.d(TAG, "releaseFile deleted " + path + ": " + deleted);
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to release file: " + path, e);
            }
        }
        call.resolve();
    }

    private JSObject processUri(Uri uri) throws Exception {
        Log.d(TAG, "processUri: uri=" + uri);

        String name = getDisplayName(uri);
        String mimeType = getMimeType(uri, name);
        long size = getSize(uri);

        if (size > MAX_FILE_SIZE) {
            throw new IllegalStateException("File is larger than 50 MB");
        }

        File cacheDir = getContext().getCacheDir();
        String safeName = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        File tempFile = new File(cacheDir, "sunny_picker_" + System.currentTimeMillis() + "_" + safeName);

        long writtenBytes = 0;
        ByteArrayOutputStream base64Buffer = new ByteArrayOutputStream();

        try (InputStream input = getContext().getContentResolver().openInputStream(uri);
             OutputStream output = new FileOutputStream(tempFile)) {
            if (input == null) throw new IllegalStateException("Could not open selected file");

            byte[] buffer = new byte[16384];
            int nRead;
            while ((nRead = input.read(buffer, 0, buffer.length)) != -1) {
                writtenBytes += nRead;
                if (writtenBytes > MAX_FILE_SIZE) {
                    if (tempFile.exists()) {
                        boolean deleted = tempFile.delete();
                        Log.d(TAG, "Exceeded max file size, deleted temp file: " + deleted);
                    }
                    throw new IllegalStateException("File is larger than 50 MB");
                }
                output.write(buffer, 0, nRead);
                base64Buffer.write(buffer, 0, nRead);
            }
            output.flush();
        }

        if (writtenBytes == 0) {
            if (tempFile.exists()) {
                boolean deleted = tempFile.delete();
                Log.d(TAG, "Empty file, deleted temp file: " + deleted);
            }
            throw new IllegalStateException("Selected file is empty");
        }

        String base64Data = Base64.encodeToString(base64Buffer.toByteArray(), Base64.NO_WRAP);

        JSObject file = new JSObject();
        file.put("name", name);
        file.put("mimeType", mimeType);
        file.put("size", size > 0 ? size : writtenBytes);
        file.put("path", tempFile.getAbsolutePath());
        file.put("data", base64Data);
        Log.d(TAG, "processUri succeeded: name=" + name + ", mimeType=" + mimeType + ", bytes=" + writtenBytes + ", path=" + tempFile.getAbsolutePath());
        return file;
    }

    private void cleanupTempFiles() {
        try {
            File cacheDir = getContext().getCacheDir();
            File[] files = cacheDir.listFiles((dir, filename) -> filename.startsWith("sunny_picker_"));
            if (files != null) {
                long now = System.currentTimeMillis();
                for (File f : files) {
                    if (now - f.lastModified() > 3600000) {
                        boolean deleted = f.delete();
                        Log.d(TAG, "Cleaned up old temp file: " + f.getName() + " -> " + deleted);
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "cleanupTempFiles error", e);
        }
    }

    private String getDisplayName(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(
                uri,
                new String[]{OpenableColumns.DISPLAY_NAME},
                null,
                null,
                null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) {
                    String value = cursor.getString(index);
                    if (value != null && !value.trim().isEmpty()) return value;
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to query DISPLAY_NAME for uri: " + uri, e);
        }

        String rawPath = uri.getPath();
        if (rawPath == null || rawPath.isEmpty()) return "attachment";
        int slash = rawPath.lastIndexOf('/');
        return slash >= 0 ? rawPath.substring(slash + 1) : rawPath;
    }

    private long getSize(Uri uri) {
        try (Cursor cursor = getContext().getContentResolver().query(
                uri,
                new String[]{OpenableColumns.SIZE},
                null,
                null,
                null
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.SIZE);
                if (index >= 0 && !cursor.isNull(index)) return cursor.getLong(index);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to query SIZE for uri: " + uri, e);
        }
        return -1;
    }

    private String getMimeType(Uri uri, String name) {
        try {
            String mimeType = getContext().getContentResolver().getType(uri);
            if (mimeType != null && !mimeType.isEmpty() && !"application/octet-stream".equalsIgnoreCase(mimeType)) {
                return mimeType;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to get type from ContentResolver: " + uri, e);
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
}

