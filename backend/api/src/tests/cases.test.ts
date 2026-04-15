import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { Case } from "../models/Case.js";
import { Nominee } from "../models/Nominee.js";
import { signToken } from "../services/tokenService.js";

describe("case routes", () => {
  const app = createApp();
  let token = "";
  let nomineeId = "";

  beforeEach(async () => {
    await Case.deleteMany({});
    await Nominee.deleteMany({});

    const nominee = await Nominee.create({
      phone: "9123456789",
      name: "Case Owner"
    });

    nomineeId = nominee._id.toString();
    token = signToken({ sub: nomineeId, phone: nominee.phone });
  });

  it("creates and fetches a case", async () => {
    const created = await request(app)
      .post("/api/cases")
      .set("Authorization", `Bearer ${token}`)
      .send({
        language: "en",
        deceased: {
          name: "Ramesh Kumar",
          pan: "ABCDE1234F",
          dateOfDeath: "2025-12-02"
        }
      })
      .expect(201);

    expect(created.body.nomineeId).toBe(nomineeId);

    const fetched = await request(app)
      .get(`/api/cases/${created.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(fetched.body.deceased.name).toBe("Ramesh Kumar");
    expect(Array.isArray(fetched.body.documents)).toBe(true);
  });
});
