'use strict';
/*
 * This module implements a mechanism which enables/disables AB tests
 *
 */

var EXPORTED_SYMBOLS = ['CliqzABTests'];

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

XPCOMUtils.defineLazyModuleGetter(this, 'CliqzUtils',
  'chrome://cliqzmodules/content/CliqzUtils.jsm');

var timer=null, ONE_HOUR = 60 * 60 * 1000;

function log(msg){
  CliqzUtils.log(msg, "CliqzABTests.jsm");
}

var CliqzABTests = {
    PREF: 'ABTests',
    PREF_OVERRIDE: 'ABTestsOverride',
    URL: 'https://logging.cliqz.com/abtests/check?session=',
    init: function(){
        CliqzABTests.check();

    },
    unload: function(){
        CliqzUtils.clearTimeout(timer);
    },
    // Accessors to list of tests this user is current in
    getCurrent: function() {
        if(CliqzUtils.hasPref(CliqzABTests.PREF))
            return JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF));
        return undefined;
    },
    setCurrent: function(tests) {
        CliqzUtils.setPref(CliqzABTests.PREF, JSON.stringify(tests))
    },

    // Accessors to list of tests in override list
    getOverride: function() {
        if(CliqzUtils.hasPref(CliqzABTests.PREF_OVERRIDE)) {
            var ABtests = JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF_OVERRIDE));
            return ABtests;
        }
        return undefined;
    },
    setOverride: function(tests) {
        if(tests)
            CliqzUtils.setPref(CliqzABTests.PREF_OVERRIDE, JSON.stringify(tests));
        else
            CliqzUtils.clearPref(CliqzABTests.PREF_OVERRIDE);
    },

    // Check for newest list of AB tests from server
    check: function() {
        log('AB checking');
        // clear the last timer
        CliqzUtils.clearTimeout(timer);
        // set a new timer to be triggered after 1 hour
        timer = CliqzUtils.setTimeout(CliqzABTests.check, ONE_HOUR);

        CliqzABTests.retrieve(
            function(response){
                try{
                    var prevABtests = {};
                    if(CliqzUtils.hasPref(CliqzABTests.PREF))
                        prevABtests = JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF));

                    var respABtests = JSON.parse(response.responseText);

                    // Override the backend response - for local testing
                    var overrideABtests = CliqzABTests.getOverride();
                    if(overrideABtests)
                        respABtests = overrideABtests;

                    var newABtests = {};

                    var changes = false; // any changes?

                    // find old AB tests to leave
                    for(var o in prevABtests) {
                        if(!respABtests[o]) {
                            if(CliqzABTests.leave(o))
                                changes = true;
                        }
                        else {
                            // keep this old test in the list of current tests
                            newABtests[o] = prevABtests[o]
                        }
                    }

                    // find new AB tests to enter
                    for(var n in respABtests) {
                        if(!(prevABtests[n])) {
                            if(CliqzABTests.enter(n, respABtests[n])) {
                                changes = true;
                                newABtests[n] = respABtests[n];
                            }
                        }
                    }

                    if(changes) {
                        CliqzUtils.setPref(CliqzABTests.PREF, JSON.stringify(newABtests))
                    }
                } catch(e){
                  log('retrieve error: ' + e.message)
                }
            });
    },
    retrieve: function(callback) {
        var url = CliqzABTests.URL + encodeURIComponent(CliqzUtils.getPref('session',''));

        var onerror = function(){ log("failed to retrieve AB test data"); }

        CliqzUtils.httpGet(url, callback, onerror, 15000);
    },
    enter: function(abtest, payload) {
        // Add new AB tests here.
        // It is safe to remove them as soon as the test is over.
        var rule_executed = true
        switch(abtest) {
            case "1024_B":
                CliqzUtils.setPref("categoryAssessment", true);
                break;
            case "1028_A":
                CliqzUtils.setPref("humanWeb", false);
                break;
            case "1028_B":
                CliqzUtils.setPref("humanWeb", true);
                break;
            case "1032_A":
                CliqzUtils.setPref("spellCorrMessage", false);
                break;
            case "1032_B":
                CliqzUtils.setPref("spellCorrMessage", true);
                break;
            case "1036_B":
                CliqzUtils.setPref("extended_onboarding_same_result", true);
                break;
            case "1045_A":
                break;
            case "1045_B":
                CliqzUtils.setPref("antiTrackTest", true);
                break;
            case "1046_B":
                CliqzUtils.setPref("attrackBlockCookieTracking", true);
                break;
            case "1047_B":
                CliqzUtils.setPref("attrackRemoveQueryStringTracking", true);
                break;
            case "1048_B":
                CliqzUtils.setPref("attrackAlterPostdataTracking", true);
                break;
            case "1049_B":
                CliqzUtils.setPref("attrackCanvasFingerprintTracking", true);
                break;
            case "1050_B":
                CliqzUtils.setPref("attrackRefererTracking", true);
                break;
            case "1051_B":
                CliqzUtils.setPref("antiTrackTest", true);
                break;
            case "1052_A":
                CliqzUtils.setPref("attrackBlockCookieTracking", false);
                break;
            case "1052_B":
                CliqzUtils.setPref("attrackBlockCookieTracking", true);
                break;
            case "1053_A":
                CliqzUtils.setPref("attrackRemoveQueryStringTracking", false);
                break;
            case "1053_B":
                CliqzUtils.setPref("attrackRemoveQueryStringTracking", true);
                break;
            case "1055_B":
                CliqzUtils.setPref("unblockMode", "always");
                break;
            case "1056_A":
                CliqzUtils.setPref("freshTabAB", false);
                break;
            case "1056_B":
                CliqzUtils.setPref("freshTabAB", true);
                break;
            case "1057_A":
                CliqzUtils.setPref("trackerTxt", false);
                break;
            case "1057_B":
                CliqzUtils.setPref("trackerTxt", true);
                break;
            case "1058_A":
                CliqzUtils.setPref("unblockMode", "never");
                break;
            case "1058_B":
                CliqzUtils.setPref("unblockMode", "always");
                break;
            case "1059_A":
                CliqzUtils.setPref("attrack.local_tracking", false);
                break;
            case "1059_B":
                CliqzUtils.setPref("attrack.local_tracking", true);
                break;
            case "1060_A":
                CliqzUtils.setPref("attrackBloomFilter", false);
                break;
            case "1060_B":
                CliqzUtils.setPref("attrackBloomFilter", true);
                break;
            case "1061_A":
                CliqzUtils.setPref("attrackUI", false);
                break;
            case "1061_B":
                CliqzUtils.setPref("attrackUI", true);
                break;
            case "1063_A":
                CliqzUtils.setPref("double-enter2", false);
                break;
            case "1063_B":
                CliqzUtils.setPref("double-enter2", true);
                break;
            case "1064_A":
                CliqzUtils.setPref("attrackDefaultAction", "same");
                break;
            case "1064_B":
                CliqzUtils.setPref("attrackDefaultAction", "placeholder");
                break;
            case "1064_C":
                CliqzUtils.setPref("attrackDefaultAction", "block");
                break;
            case "1064_D":
                CliqzUtils.setPref("attrackDefaultAction", "empty");
                break;
            case "1064_E":
                CliqzUtils.setPref("attrackDefaultAction", "replace");
                break;
            case "1065_A":
                CliqzUtils.setPref("freshTabNewsEmail", false);
                break;
            case "1065_B":
                CliqzUtils.setPref("freshTabNewsEmail", true);
                break;
            case "1066_A":
                CliqzUtils.setPref("proxyNetwork", false);
                break;
            case "1066_B":
                CliqzUtils.setPref("proxyNetwork", true);
                break;
            default:
                rule_executed = false;
        }
        if(rule_executed) {
            var action = {
                type: 'abtest',
                action: 'enter',
                name: abtest
            };
            CliqzUtils.telemetry(action);

            return true;
       } else {
            return false;
       }
    },
    leave: function(abtest, disable) {
        // Restore defaults after an AB test is finished.
        // DO NOT remove test cleanup code too quickly, a user
        // might not start the browser for a long time and
        // get stuck in a test if we remove cases too early.
        var rule_executed = true;
        switch(abtest) {
            case "1024_B":
                CliqzUtils.clearPref("categoryAssessment");
                break;
            case "1028_A":
            case "1028_B":
                CliqzUtils.clearPref("humanWeb");
                break;
            case "1032_A":
            case "1032_B":
                CliqzUtils.clearPref("spellCorrMessage");
                break;
            case "1036_A":
            case "1036_B":
                CliqzUtils.clearPref("extended_onboarding_same_result");
                CliqzUtils.clearPref("extended_onboarding");
                break;
            case "1045_A":
            case "1045_B":
                CliqzUtils.clearPref("antiTrackTest");
                break;
            case "1046_A":
            case "1047_A":
            case "1048_A":
            case "1049_A":
            case "1050_A":
                break;
            case "1046_B":
                CliqzUtils.clearPref("attrackBlockCookieTracking");
                break;
            case "1047_B":
                CliqzUtils.clearPref("attrackRemoveQueryStringTracking");
                break;
            case "1048_B":
                CliqzUtils.clearPref("attrackAlterPostdataTracking");
                break;
            case "1049_B":
                CliqzUtils.clearPref("attrackCanvasFingerprintTracking");
                break;
            case "1050_B":
                CliqzUtils.clearPref("attrackRefererTracking");
                break;
            case "1051_B":
                CliqzUtils.clearPref("antiTrackTest");
                break;
            case "1052_B":
                CliqzUtils.clearPref("attrackBlockCookieTracking");
                break;
            case "1053_B":
                CliqzUtils.clearPref("attrackRemoveQueryStringTracking");
                break;
            case "1055_A":
            case "1055_B":
                CliqzUtils.clearPref("unblockEnabled");
                break;
            case "1056_A":
            case "1056_B":
                CliqzUtils.clearPref("freshTabAB");
                break;
            case "1057_B":
                CliqzUtils.clearPref("trackerTxt");
                break;
            case "1058_A":
            case "1058_B":
                CliqzUtils.clearPref("unblockMode");
                break;
            case "1059_A":
            case "1059_B":
                CliqzUtils.clearPref("attrack.local_tracking");
                break;
            case "1060_A":
            case "1060_B":
                CliqzUtils.clearPref("attrackBloomFilter");
                break;
            case "1061_A":
            case "1061_B":
                CliqzUtils.clearPref("attrackUI");
                break;
            case "1063_A":
            case "1063_B":
                CliqzUtils.clearPref("double-enter2");
                break;
            case "1064_A":
            case "1064_B":
            case "1064_C":
            case "1064_D":
            case "1064_E":
                CliqzUtils.clearPref("attrackDefaultAction");
                break;
            case "1066_A":
            case "1066_B":
                CliqzUtils.clearPref("proxyNetwork");
                break;
            case "1065_A":
            case "1065_B":
                CliqzUtils.clearPref("freshTabNewsEmail");
                break;
            default:
                rule_executed = false;
        }
        if(rule_executed) {
            var action = {
                type: 'abtest',
                action: 'leave',
                name: abtest,
                disable: disable
            };
            CliqzUtils.telemetry(action);
            return true;
       } else {
            return false;
       }
    },
    disable: function(abtest) {
        // Disable an AB test but do not remove it from list of active AB tests,
        // this is intended to be used by the extension itself when it experiences
        // an error associated with this AB test.
        if(CliqzUtils.hasPref(CliqzABTests.PREF)) {
             var curABtests = JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF));

            if(curABtests[abtest] && CliqzABTests.leave(abtest, true)) {
                // mark as disabled and save back to preferences
                curABtests[abtest].disabled = true;
                CliqzUtils.setPref(CliqzABTests.PREF, JSON.stringify(curABtests))
            }
        }
    },
}