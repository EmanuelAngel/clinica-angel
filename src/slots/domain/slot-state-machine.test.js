import { SlotStateMachine, SlotActions } from "./slot-state-machine.js";
import { SlotStatus } from "../../schedules/domain/slot-status.js";
import { Roles } from "../../auth/domain/roles.js";

describe("SlotStateMachine", () => {
  describe("canTransition", () => {
    describe("valid transitions", () => {
      test.each([
        [SlotStatus.FREE, SlotActions.RESERVE],
        [SlotStatus.PROPOSED, SlotActions.CONFIRM],
        [SlotStatus.PROPOSED, SlotActions.CANCEL],
        [SlotStatus.PROPOSED, SlotActions.RELEASE],
        [SlotStatus.BOOKED, SlotActions.ARRIVE],
        [SlotStatus.BOOKED, SlotActions.NO_SHOW],
        [SlotStatus.BOOKED, SlotActions.RELEASE],
        [SlotStatus.CANCELLED, SlotActions.RELEASE],
        [SlotStatus.ARRIVED, SlotActions.START],
        [SlotStatus.ARRIVED, SlotActions.RELEASE],
        [SlotStatus.NO_SHOW, SlotActions.RELEASE],
        [SlotStatus.IN_PROGRESS, SlotActions.FULFILL],
        [SlotStatus.IN_PROGRESS, SlotActions.RELEASE],
      ])("%s + %s → true", (status, action) => {
        expect(SlotStateMachine.canTransition(status, action)).toBe(true);
      });
    });

    describe("invalid transitions", () => {
      test.each([
        [SlotStatus.FREE, SlotActions.CONFIRM],
        [SlotStatus.FREE, SlotActions.CANCEL],
        [SlotStatus.FREE, SlotActions.RELEASE],
        [SlotStatus.PROPOSED, SlotActions.RESERVE],
        [SlotStatus.PROPOSED, SlotActions.ARRIVE],
        [SlotStatus.BOOKED, SlotActions.RESERVE],
        [SlotStatus.BOOKED, SlotActions.CONFIRM],
        [SlotStatus.FULFILLED, SlotActions.RELEASE],
        [SlotStatus.FULFILLED, SlotActions.CANCEL],
        [SlotStatus.FULFILLED, SlotActions.RESERVE],
      ])("%s + %s → false", (status, action) => {
        expect(SlotStateMachine.canTransition(status, action)).toBe(false);
      });
    });
  });

  describe("getNextState", () => {
    test.each([
      [SlotStatus.FREE, SlotActions.RESERVE, SlotStatus.PROPOSED],
      [SlotStatus.PROPOSED, SlotActions.CONFIRM, SlotStatus.BOOKED],
      [SlotStatus.PROPOSED, SlotActions.CANCEL, SlotStatus.CANCELLED],
      [SlotStatus.PROPOSED, SlotActions.RELEASE, SlotStatus.FREE],
      [SlotStatus.BOOKED, SlotActions.ARRIVE, SlotStatus.ARRIVED],
      [SlotStatus.BOOKED, SlotActions.NO_SHOW, SlotStatus.NO_SHOW],
      [SlotStatus.BOOKED, SlotActions.RELEASE, SlotStatus.FREE],
      [SlotStatus.ARRIVED, SlotActions.START, SlotStatus.IN_PROGRESS],
      [SlotStatus.ARRIVED, SlotActions.RELEASE, SlotStatus.FREE],
      [SlotStatus.IN_PROGRESS, SlotActions.FULFILL, SlotStatus.FULFILLED],
      [SlotStatus.IN_PROGRESS, SlotActions.RELEASE, SlotStatus.FREE],
    ])("%s + %s → %s", (from, action, expected) => {
      expect(SlotStateMachine.getNextState(from, action)).toBe(expected);
    });

    test("returns null for invalid transition", () => {
      expect(
        SlotStateMachine.getNextState(SlotStatus.FREE, SlotActions.FULFILL)
      ).toBeNull();
    });
  });

  describe("isRoleAuthorized", () => {
    describe("RESERVE — ADMIN, SECRETARY and PATIENT are allowed", () => {
      test.each([Roles.ADMIN, Roles.SECRETARY, Roles.PATIENT])(
        "%s can RESERVE",
        (role) => {
          expect(
            SlotStateMachine.isRoleAuthorized(SlotActions.RESERVE, role)
          ).toBe(true);
        }
      );

      test("PROFESSIONAL cannot RESERVE", () => {
        expect(
          SlotStateMachine.isRoleAuthorized(
            SlotActions.RESERVE,
            Roles.PROFESSIONAL
          )
        ).toBe(false);
      });
    });

    describe("staff-only actions — only ADMIN and SECRETARY are allowed", () => {
      const staffOnlyActions = [
        SlotActions.CONFIRM,
        SlotActions.CANCEL,
        SlotActions.ARRIVE,
        SlotActions.NO_SHOW,
        SlotActions.START,
        SlotActions.FULFILL,
        SlotActions.RELEASE,
      ];

      test.each(staffOnlyActions)("ADMIN can %s", (action) => {
        expect(SlotStateMachine.isRoleAuthorized(action, Roles.ADMIN)).toBe(
          true
        );
      });

      test.each(staffOnlyActions)("SECRETARY can %s", (action) => {
        expect(SlotStateMachine.isRoleAuthorized(action, Roles.SECRETARY)).toBe(
          true
        );
      });

      test.each(staffOnlyActions)("PATIENT cannot %s", (action) => {
        expect(SlotStateMachine.isRoleAuthorized(action, Roles.PATIENT)).toBe(
          false
        );
      });

      test.each(staffOnlyActions)("PROFESSIONAL cannot %s", (action) => {
        expect(
          SlotStateMachine.isRoleAuthorized(action, Roles.PROFESSIONAL)
        ).toBe(false);
      });
    });
  });

  describe("isTerminal", () => {
    test("FULFILLED is the only terminal state", () => {
      expect(SlotStateMachine.isTerminal(SlotStatus.FULFILLED)).toBe(true);
    });

    test.each([
      SlotStatus.FREE,
      SlotStatus.PROPOSED,
      SlotStatus.BOOKED,
      SlotStatus.CANCELLED,
      SlotStatus.ARRIVED,
      SlotStatus.NO_SHOW,
      SlotStatus.IN_PROGRESS,
    ])("%s is not terminal", (status) => {
      expect(SlotStateMachine.isTerminal(status)).toBe(false);
    });
  });
});
