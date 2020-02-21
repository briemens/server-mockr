import "jest";

import { ServerMockr, stateParam } from "../";
import { get, setup } from "./utils";

describe("scenario()", () => {
  let mockr: ServerMockr;

  beforeAll(() => {
    mockr = setup();
  });

  afterAll(() => mockr.stop());

  beforeEach(() => {
    mockr.clear();
  });

  /*
   * scenario()
   */

  describe("()", () => {
    test("should match when started", async () => {
      mockr
        .scenario("id")
        .when("/test")
        .respond("ok");
      mockr.startScenario("id");
      const res = await get("/test");
      expect(res.text).toEqual("ok");
    });

    test("should not match when not started", async () => {
      mockr
        .scenario("id")
        .when("/test")
        .respond("ok");
      const res = await get("/test");
      expect(res.status).toEqual(404);
    });

    test("should not match when stopped", async () => {
      mockr
        .scenario("id")
        .when("/test")
        .respond("ok");
      mockr.startScenario("id");
      const res = await get("/test");
      expect(res.text).toEqual("ok");
      mockr.stopScenario("id");
      const res2 = await get("/test");
      expect(res2.status).toEqual(404);
    });

    test("should not keep state when restarted", async () => {
      mockr
        .scenario("id")
        .when("/test", stateParam("language", "nl"))
        .respond("ok");
      mockr.startScenario("id", { language: "nl" });
      const res = await get("/test");
      expect(res.text).toEqual("ok");
      mockr.stopScenario("id");
      mockr.startScenario("id");
      const res2 = await get("/test");
      expect(res2.status).toEqual(404);
    });

    test("should set default state", async () => {
      mockr
        .scenario("id")
        .stateParam("language", { type: "string", default: "nl" })
        .when("/test", stateParam("language", "nl"))
        .respond("ok");
      mockr.startScenario("id");
      const res = await get("/test");
      expect(res.text).toEqual("ok");
    });

    test("should not match if default state does not match", async () => {
      mockr
        .scenario("id")
        .stateParam("language", { type: "string", default: "nl" })
        .when("/test", stateParam("language", "en"))
        .respond("ok");
      mockr.startScenario("id");
      const res = await get("/test");
      expect(res.status).toEqual(404);
    });

    test("should set given state", async () => {
      mockr
        .scenario("id")
        .stateParam("language", { type: "string", default: "nl" })
        .when("/test", stateParam("language", "en"))
        .respond("ok");
      mockr.startScenario("id", { language: "en" });
      const res = await get("/test");
      expect(res.text).toEqual("ok");
    });

    test("should match multiple expectations", async () => {
      const scenario = mockr.scenario("id");
      scenario.when("/test").respond("ok");
      scenario.when("/test-2").respond("ok");
      mockr.startScenario("id");
      const res = await get("/test");
      expect(res.text).toEqual("ok");
      const res2 = await get("/test-2");
      expect(res2.text).toEqual("ok");
    });

    test("should be able to add expectations in onStart callback", async () => {
      mockr.scenario("id").onStart(({ when }) => {
        when("/test").respond("ok");
      });
      mockr.startScenario("id");
      const res = await get("/test");
      expect(res.text).toEqual("ok");
    });

    test("should only have one active scenario if configured", async () => {
      mockr
        .scenario("id1")
        .when("/test-1")
        .respond("ok1");

      mockr
        .scenario("id2")
        .when("/test-2")
        .respond("ok2");

      mockr.startScenario("id1");
      const res = await get("/test-1");
      expect(res.text).toEqual("ok1");
      mockr.startScenario("id2");
      const res2 = await get("/test-1");
      expect(res2.status).toEqual(404);
      const res3 = await get("/test-2");
      expect(res3.text).toEqual("ok2");
    });
  });
});