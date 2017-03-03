import AjaxClient from "./../../utils/AjaxClient";
import * as FbActions from "./../../config/actions/FacebookConfigureActions";
import * as WebConfigActions from "./../../config/actions/WebConfigureActions";
import * as TwitterConfigureActions from "./../../config/actions/TwitterConfigureActions";
import fetch from "isomorphic-fetch";
import AppWindow from "../../utils/AppWindow";
import R from "ramda"; //eslint-disable-line id-length

export const GOT_CONFIGURED_SOURCES = "GOT_CONFIGURED_SOURCES";
export const CLEAR_SOURCES = "CLEAR_SOURCES";
export const CHANGE_CURRENT_SOURCE_TAB = "CHANGE_CURRENT_SOURCE_TAB";
export const WEB = "web";
export const TWITTER = "twitter";
export const FETCHING_SOURCE_RESULTS = "FETCHING_SOURCE_RESULTS";
export const FETCHING_SOURCE_RESULTS_FAILED = "FETCHING_SOURCE_RESULTS_FAILED";
export const CONFIGURED_SOURCE_SEARCH_KEYWORD = "CONFIGURED_SOURCE_SEARCH_KEYWORD";
export const SOURCE_DELETED = "SOURCE_DELETED";
export const UNMARK_DELETED_SOURCE = "UNMARK_DELETED_SOURCE";
export const DELETE_SOURCE_STATUS = "DELETE_SOURCE_STATUS";

export function configuredSourcesReceived(sources) {
    return {
        "type": GOT_CONFIGURED_SOURCES,
        "sources": sources
    };
}

export const clearSources = { "type": CLEAR_SOURCES };

export function getConfiguredSources() {
    let ajaxClient = AjaxClient.instance("/configure-sources");
    return async dispatch => {
        let sources = null;
        try {
            sources = await ajaxClient.get();
            dispatch(configuredSourcesReceived(sources));
        } catch(err) { //eslint-disable-line no-empty
            /* TODO: we can use this to stop the spinner or give a warning once request failed */ //eslint-disable-line
        }
    };
}

export function addSourceToConfigureList(sourceType, ...sources) {
    switch (sourceType) {
    case FbActions.PROFILES: {
        let configuredSources = sources.map(source => Object.assign({}, source, { "url": source.id }));
        return dispatch => addToConfiguredSources(dispatch, configuredSources, "fb_profile", FbActions.FACEBOOK_ADD_PROFILE);
    }
    case FbActions.PAGES: {
        let configuredSources = sources.map(source => Object.assign({}, source, { "url": source.id }));
        return dispatch => addToConfiguredSources(dispatch, configuredSources, "fb_page", FbActions.FACEBOOK_ADD_PAGE);
    }
    case FbActions.GROUPS: {
        let configuredSources = sources.map(source => Object.assign({}, source, { "url": source.id }));
        return dispatch => addToConfiguredSources(dispatch, configuredSources, "fb_group", FbActions.FACEBOOK_ADD_GROUP);
    }
    case WEB: {
        let configuredSources = Object.assign([], sources);
        return dispatch => addToConfiguredSources(dispatch, configuredSources, "web", WebConfigActions.WEB_ADD_SOURCE);
    }
    case TWITTER: {
        let configuredSources = sources.map(source => Object.assign({}, source, { "url": source.id }));
        return dispatch => addToConfiguredSources(dispatch, configuredSources, "twitter", TwitterConfigureActions.TWITTER_ADD_SOURCE);
    }
    default: {
        return {
            "type": FbActions.FACEBOOK_ADD_PROFILE,
            sources
        };
    }
    }
}

async function addToConfiguredSources(dispatch, sources, sourceType, eventType) {
    let data = await fetch(`${AppWindow.instance().get("serverUrl")}/configure-sources`, {
        "method": "PUT",
        "headers": {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        "credentials": "same-origin",
        "body": JSON.stringify({ "sources": sources, "type": sourceType })
    });
    if (data.ok) {
        dispatch({
            "type": eventType,
            sources
        });
    }
}

export function addAllSources() {
    return (dispatch, getState) => {
        let sourceType = getState().currentSourceTab;
        let sources = getState().sourceResults.data;
        let unConfiguredSources = R.reject(source => source.added, sources);
        if(unConfiguredSources.length) {
            dispatch(addSourceToConfigureList(sourceType, ...unConfiguredSources));
        }
    };
}

export function switchSourceTab(currentTab) {
    return {
        "type": CHANGE_CURRENT_SOURCE_TAB,
        currentTab
    };
}

export const fetchingSources = { "type": FETCHING_SOURCE_RESULTS };

export function fetchingSourcesFailed(keyword) {
    return {
        "type": FETCHING_SOURCE_RESULTS_FAILED,
        keyword
    };
}

export function searchInConfiguredSources(keyword = "") {
    return {
        "type": CONFIGURED_SOURCE_SEARCH_KEYWORD,
        keyword
    };
}

export function getSources(sourceType, keyword, params, twitterPreFirstId = 0) { //eslint-disable-line no-magic-numbers
    switch (sourceType) {
    case FbActions.PAGES: {
        return FbActions.fetchFacebookSources(keyword, "page", sourceType, params);
    }
    case FbActions.GROUPS: {
        return FbActions.fetchFacebookSources(keyword, "group", sourceType, params);
    }
    case FbActions.PROFILES: {
        return FbActions.fetchFacebookSources(keyword, "profile", sourceType, params);
    }
    case WEB: {
        return WebConfigActions.fetchWebSources(keyword, params);
    }
    case TWITTER: {
        return TwitterConfigureActions.fetchTwitterSources(keyword, params, twitterPreFirstId);
    }
    default: {
        return FbActions.fetchFacebookSources(keyword, "page", sourceType, params);
    }
    }
}

export function deleteSource(configuredSources, currentTab, sourceToDelete) {
    const headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
    let updatedSources = [];

    if(currentTab === "profiles" || currentTab === "pages" || currentTab === "groups") {
        updatedSources = getUpdatedSources(configuredSources, "profiles", sourceToDelete._id);
        updatedSources = getUpdatedSources(configuredSources, "pages", sourceToDelete._id);
        updatedSources = getUpdatedSources(configuredSources, "groups", sourceToDelete._id);
    } else {
        updatedSources = getUpdatedSources(configuredSources, currentTab, sourceToDelete._id);
    }

    return async dispatch => {
        let ajaxInstance = AjaxClient.instance("/delete-sources");
        let response = await ajaxInstance.post(headers, { "sources": [sourceToDelete._id] });

        if(response[0] && response[0].ok) { //eslint-disable-line no-magic-numbers
            dispatch(unmarkSource(sourceToDelete));
            dispatch(deletedSource(updatedSources));
            dispatch(deleteSourceStatus("Deleted Source Successfully"));
        } else {
            dispatch(deleteSourceStatus("Could not delete source"));
        }
    };
}

function getUpdatedSources(configuredSources, sourceTab, sourceToDeleteId) {
    let sources = configuredSources[sourceTab].filter((source) => { //eslint-disable-line consistent-return
        if(source._id !== sourceToDeleteId) {
            return source;
        }
    });
    if(configuredSources[sourceTab].length !== sources.length) {
        configuredSources[sourceTab] = sources;
    }
    return configuredSources;
}

function deletedSource(configuredSources) {
    return {
        "type": SOURCE_DELETED,
        "sources": configuredSources
    };
}

function unmarkSource(sourceToDelete) {
    return {
        "type": UNMARK_DELETED_SOURCE,
        "source": sourceToDelete
    };
}

export function deleteSourceStatus(message) {
    return {
        "type": DELETE_SOURCE_STATUS,
        message
    };
}
