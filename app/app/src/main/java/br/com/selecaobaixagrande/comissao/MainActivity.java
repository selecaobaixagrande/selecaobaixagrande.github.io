package br.com.selecaobaixagrande.comissao;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;

public class MainActivity extends Activity {
  @Override public void onCreate(Bundle b){ super.onCreate(b);
    WebView w=new WebView(this); w.setBackgroundColor(Color.rgb(7,10,18));
    WebSettings s=w.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setAllowFileAccess(true); s.setAllowContentAccess(true);
    w.setWebViewClient(new WebViewClient()); w.loadUrl("file:///android_asset/index.html"); setContentView(w);
  }
  @Override public void onBackPressed(){ WebView w=(WebView)findViewById(android.R.id.content); super.onBackPressed(); }
}
