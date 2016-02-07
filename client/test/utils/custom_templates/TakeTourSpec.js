/* eslint max-nested-callbacks: [2, 7], radix:0 */
"use strict";

import TakeTour from "../../../src/js/utils/custom_templates/TakeTour";
import sinon from "sinon";
import { assert } from "chai";

let json = null, configureElement = null, addUrlElement = null, getJsonMock = null;
describe("TakeTour", () => {
    beforeEach("before", ()=> {
        json = {
            "navigation": [
                {
                    "selector": "#configure-element",
                    "actionSelector": "#configure-element",
                    "content": "Click here to configure"
                },
                {
                    "selector": "#addURl-element",
                    "actionSelector": "#addURl-element",
                    "content": "Click here to add url"
                }

            ]
        };
        TakeTour.currentIndex = -1;
        TakeTour.total = 2;

        configureElement = document.createElement("div");
        configureElement.id = "configure-element";
        configureElement.style.position = "absolute";
        configureElement.offsetTop = 100;
        configureElement.offsetLeft = 100;
        configureElement.offsetWidth = 100;
        configureElement.offsetHeight = 100;
        document.body.appendChild(configureElement);

        addUrlElement = document.createElement("div");
        addUrlElement.id = "addURl-element";
        addUrlElement.style.position = "absolute";
        addUrlElement.offsetTop = 200;
        addUrlElement.offsetLeft = 200;
        addUrlElement.offsetWidth = 200;
        addUrlElement.offsetHeight = 200;
        document.body.appendChild(addUrlElement);

        getJsonMock = sinon.mock(TakeTour).expects("getJson");
        getJsonMock.returns(json);

        TakeTour.show();

    });
    afterEach("after", ()=> {
        json = null;
        document.body.removeChild(configureElement);
        document.body.removeChild(addUrlElement);
        TakeTour.currentIndex = -1;
        getJsonMock.verify();
        TakeTour.getJson.restore();
    });

    describe("TakeTour", () => {
        it("should have TakeTour template in the document", () => {
            assert.isNotNull(document.getElementById("take-tour"), "Take Tour template is available");
        });

        it("should navigate to the first item with description", ()=> {
            assert.strictEqual("Click here to configure", document.querySelector("#take-tour .description").textContent);
        });

        it("should get the json element with given index", ()=> {
            TakeTour.currentIndex = 0;
            let jsonElement = TakeTour.getCurrentJsonElement();
            assert.deepEqual({
                "selector": "#configure-element",
                "content": "Click here to configure",
                "actionSelector": "#configure-element"
            }, jsonElement);
        });

        xit("should point configure element", () => {
            let sandbox = sinon.sandbox.create();
            let clock = sandbox.useFakeTimers();
            let time = 100;
            let top = 220;

            clock.tick(time);
            assert.strictEqual(top, parseInt(document.querySelector("#take-tour").style.top));
            clock.restore();
        });

        xit("should move to next hint on clicking continue button", () => {
            let sandbox = sinon.sandbox.create();
            let clock = sandbox.useFakeTimers();
            let time = 100;
            clock.tick(time);

            document.querySelector("#tour-continue").click();
            let top = 420;
            assert.strictEqual(top, parseInt(document.querySelector("#take-tour").style.top));
            clock.restore();
        });

        it("should update the description on clicking continue button", ()=> {
            document.querySelector("#tour-continue").click();
            assert.strictEqual("Click here to add url", document.querySelector("#take-tour .description").textContent);
        });

        it("should hide continue button for the last hint", ()=> {
            TakeTour.currentIndex = 1;
            document.querySelector("#tour-continue").click();
            assert.isTrue(document.querySelector("#tour-continue").classList.contains("hide"));
        });

        it("should hide the tour on clicking abort", ()=> {
            TakeTour.currentIndex = 1;
            document.querySelector("#tour-abort").click();
            assert.isTrue(document.querySelector("#take-tour-mask").classList.contains("hide"));
        });
    });
});
