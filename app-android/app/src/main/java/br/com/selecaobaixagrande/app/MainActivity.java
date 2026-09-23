package br.com.selecaobaixagrande.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 8, 9));
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        setContentView(webView);
        loadLocalPanel();
    }

    private void loadLocalPanel() {
        try {
            InputStream input = getAssets().open("comissao.html");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            input.close();

            String html = output.toString(StandardCharsets.UTF_8.name());
            webView.loadDataWithBaseURL(
                "https://selecaobaixagrande.github.io/",
                html,
                "text/html",
                "UTF-8",
                null
            );
        } catch (Exception e) {
            webView.loadData(
                "<html><body style='background:#070809;color:white;font-family:sans-serif;padding:30px'><h2>Erro ao carregar o aplicativo</h2><p>O painel local não pôde ser aberto.</p></body></html>",
                "text/html",
                "UTF-8"
            );
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
