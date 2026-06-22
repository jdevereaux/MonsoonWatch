package com.monsoonwatch;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import java.util.List;
import java.io.FileWriter;
import java.io.IOException;

public class MainApplication extends Application implements ReactApplication {

    private void log(String msg) {
        try {
            FileWriter fw = new FileWriter("/sdcard/monsoon_log.txt", true);
            fw.write(msg + "\n");
            fw.close();
        } catch (IOException e) {}
    }

    private final ReactNativeHost mReactNativeHost =
        new DefaultReactNativeHost(this) {
            @Override
            public boolean getUseDeveloperSupport() {
                return BuildConfig.DEBUG;
            }

            @Override
            protected List<ReactPackage> getPackages() {
                return new PackageList(this).getPackages();
            }

            @Override
            protected String getJSMainModuleName() {
                return "index";
            }

            @Override
            protected boolean isNewArchEnabled() {
                return false;
            }

            @Override
            protected Boolean isHermesEnabled() {
                return true;
            }
        };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        log("onCreate started");
        try {
            SoLoader.init(this, false);
            log("SoLoader OK");
        } catch (Throwable t) {
            log("SoLoader FAILED: " + t.getMessage());
            return;
        }
        log("onCreate complete");
    }
}
