import FilterTab from "../../../src/js/newsboard/filter/FilterTab";
import * as FilterActions from "../../../src/js/newsboard/filter/FilterActions";
import TestUtils from "react-addons-test-utils";
import React from "react";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";
import sinon from "sinon";
import { assert } from "chai";

describe("FilterTab", () => {
    let filterTab = null;
    const anonymousFun = () => {};

    it("should have news-board-tab active class", () => {
        let store = createStore(() => ({
            "currentFilter": "twitter"
        }), applyMiddleware(thunkMiddleware));

        filterTab = TestUtils.renderIntoDocument(
            <Provider store= {store}>
                <FilterTab dispatch={anonymousFun} sourceIcon={"twitter"} sourceType={"twitter"}/>
            </Provider>);

        assert.isNotNull(TestUtils.findRenderedDOMComponentWithClass(filterTab, "news-board-tab active"));
    });

    it("should dispatch filterTabSwitch on click", () => {
        let store = createStore(() => ({
            "currentFilter": "trending"
        }), applyMiddleware(thunkMiddleware));

        let sandbox = sinon.sandbox.create();

        filterTab = TestUtils.renderIntoDocument(
            <Provider store= {store}>
                <FilterTab dispatch={anonymousFun} sourceIcon={"twitter"} sourceType={"twitter"}/>
            </Provider>);

        let filterTabSwitchMock = sandbox.mock(FilterActions).expects("filterTabSwitch").returns({ "type": "" });
        let newsBoardTab = TestUtils.findRenderedDOMComponentWithClass(filterTab, "news-board-tab");
        TestUtils.Simulate.click(newsBoardTab);
        assert.isNotNull(newsBoardTab);
        filterTabSwitchMock.verify();
    });


});
