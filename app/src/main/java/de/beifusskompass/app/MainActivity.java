package de.beifusskompass.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.WindowInsets;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/** Offline shell. No INTERNET permission, no remote content, narrow document bridge. */
public final class MainActivity extends Activity {
    private static final int EXPORT = 41, IMPORT = 42, LIMIT = 2 * 1024 * 1024;
    private static final String ORIGIN = "https://appassets.androidplatform.net/assets/";
    private WebView web;
    private File pendingExport;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        pendingExport=new File(getCacheDir(),"pending-backup.json");
        web = new WebView(this);
        setContentView(web);
        web.setBackgroundColor(Color.rgb(247,248,242));
        // Target 36 is edge-to-edge: apply system/IME insets to the WebView itself.
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            web.setOnApplyWindowInsetsListener((v,insets) -> {
                android.graphics.Insets i = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                v.setPadding(i.left,i.top,i.right,i.bottom);
                return insets;
            });
            web.requestApplyInsets();
        }
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); // Only trusted packaged content is served below.
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        web.setWebChromeClient(new WebChromeClient());
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                WebResourceResponse local = loader.shouldInterceptRequest(req.getUrl());
                return local != null ? local : new WebResourceResponse("text/plain","UTF-8",403,"Blocked",null,new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req) {
                Uri u=req.getUrl();
                if (u.toString().startsWith(ORIGIN)) return false;
                if (req.isForMainFrame() && ("https".equals(u.getScheme()) || "tel".equals(u.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW,u)); }
                    catch (Exception e) { toast("Kein passendes Programm gefunden."); }
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Documents(),"AndroidDocuments");
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
            android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::handleBack);
        if (saved == null || web.restoreState(saved) == null) web.loadUrl(ORIGIN+"index.html");
    }
    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out); web.saveState(out);
    }
    private void toast(String s) { runOnUiThread(() -> Toast.makeText(this,s,Toast.LENGTH_LONG).show()); }
    private boolean trusted() { return web.getUrl()!=null && web.getUrl().startsWith(ORIGIN); }
    public final class Documents {
        @JavascriptInterface public void exportBackup(String json) {
            if(json==null || json.getBytes(StandardCharsets.UTF_8).length>LIMIT) { toast("Sicherung ist zu groß."); return; }
            runOnUiThread(() -> {
                if(!trusted()) return;
                try (OutputStream out=new FileOutputStream(pendingExport)) {
                    out.write(json.getBytes(StandardCharsets.UTF_8));
                } catch(Exception e) { toast("Sicherung konnte nicht vorbereitet werden.");return; }
                Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");
                i.putExtra(Intent.EXTRA_TITLE,"BeifussKompass-Sicherung.json");
                try { startActivityForResult(i,EXPORT); } catch(Exception e) { pendingExport.delete();toast("Dateiauswahl nicht verfügbar."); }
            });
        }
        @JavascriptInterface public void importBackup() {
            runOnUiThread(() -> {
                if(!trusted()) return;
                Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try { startActivityForResult(i,IMPORT); } catch(Exception e) { toast("Dateiauswahl nicht verfügbar."); }
            });
        }
        @JavascriptInterface public void shareSummary(String text) {
            if(text==null || text.length()>200000) return;
            runOnUiThread(() -> {
                if(!trusted()) return;
                Intent i=new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT,text);
                startActivity(Intent.createChooser(i,"Übersicht teilen"));
            });
        }
    }
    @Override protected void onActivityResult(int request,int result,Intent data) {
        super.onActivityResult(request,result,data);
        if(result!=RESULT_OK || data==null || data.getData()==null) { if(request==EXPORT)pendingExport.delete();return; }
        Uri uri=data.getData();
        try {
            if(request==EXPORT && pendingExport.exists()) {
                try(OutputStream out=getContentResolver().openOutputStream(uri,"wt");InputStream in=new FileInputStream(pendingExport)) {
                    if(out==null)throw new Exception("No output");
                    byte[] buffer=new byte[8192];int n;
                    while((n=in.read(buffer))!=-1)out.write(buffer,0,n);
                }
                pendingExport.delete();toast("Sicherung gespeichert. Sie enthält persönliche Angaben.");
            } else if(request==IMPORT) {
                String json;
                try(InputStream in=getContentResolver().openInputStream(uri);ByteArrayOutputStream out=new ByteArrayOutputStream()) {
                    if(in==null)throw new Exception("No input");
                    byte[] buffer=new byte[8192];int n;
                    while((n=in.read(buffer))!=-1) { if(out.size()+n>LIMIT)throw new Exception("Size limit");out.write(buffer,0,n); }
                    json=out.toString(StandardCharsets.UTF_8.name());
                }
                if(trusted()) web.evaluateJavascript("window.receiveBackup("+JSONObject.quote(json)+")",null);
            }
        } catch(Exception e) { pendingExport.delete();toast("Datei konnte nicht verarbeitet werden. Vorhandene Daten bleiben erhalten."); }
    }
    @Override public void onBackPressed() {
        handleBack();
    }
    private void handleBack() {
        web.evaluateJavascript("window.appBack ? window.appBack() : false",handled -> {
            if(!"true".equals(handled)) new AlertDialog.Builder(this).setMessage("BeifußKompass schließen?")
                .setPositiveButton("Schließen",(d,w)->finish()).setNegativeButton("Bleiben",null).show();
        });
    }
    @Override protected void onDestroy() { web.removeJavascriptInterface("AndroidDocuments");web.destroy();super.onDestroy(); }
}
