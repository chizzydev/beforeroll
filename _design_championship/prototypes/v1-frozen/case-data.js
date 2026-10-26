export const evidence = {
  "case": {
    "id": "U01",
    "title": "Archive floor / rolling camera carriage",
    "intent": "Cross-vocabulary camera movement with a scene-scoped signed exception and an unapproved email request.",
    "permit": "LOCATION CONSENT HW-18 covers filming in Riverton Archive Atrium on 8 November 2026.\nPressure-bearing wheeled camera platforms must not cross the original tesserae until written registrar consent is issued.\nSIGNED ADDENDUM AD-4 specifically permits Scene 47 to use a rubber-tyred tracking carriage across the mosaic floor only while protective boards and an on-site registrar are present throughout.\nThe location manager emailed a request to extend the exception to Scene 48, but that message was not issued as a signed amendment.",
    "scenes": [
      "Scene 47 | RIVERTON ARCHIVE ATRIUM | 10:05-10:25 | Follow the performer on a wheeled dolly as the camera glides over the ancient mosaic floor.",
      "Scene 48 | RIVERTON ARCHIVE ATRIUM | 11:10-11:30 | Film a similar travelling shot using a rolling camera platform across the mosaic floor."
    ],
    "permitSha256": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
    "sceneSha256": [
      "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
      "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d"
    ]
  },
  "recording": {
    "source": "live-clocked-decide-multi-scene",
    "endpoint": "decide",
    "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
    "scenes": [
      {
        "sceneId": "S47",
        "sceneRow": "Scene 47 | RIVERTON ARCHIVE ATRIUM | 10:05-10:25 | Follow the performer on a wheeled dolly as the camera glides over the ancient mosaic floor.",
        "sceneHash": "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
        "status": "COMPLETE",
        "scan": {
          "source": "live-clocked-decide-condition-sweep",
          "endpoint": "decide",
          "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
          "sceneHash": "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
          "scene": {
            "text": "Scene 47 | RIVERTON ARCHIVE ATRIUM | 10:05-10:25 | Follow the performer on a wheeled dolly as the camera glides over the ancient mosaic floor."
          },
          "candidatesDetected": 4,
          "candidatesEvaluated": 4,
          "attempts": 4,
          "sourceUnscanned": [],
          "complete": true,
          "interpretationScope": "ONLY_SEGMENTED_CLAUSES_NOT_ENTIRE_PERMIT_AUTHORITY",
          "reportedCredits": 4,
          "observedKnownCredits": 4,
          "results": [
            {
              "index": 1,
              "range": [
                0,
                84
              ],
              "clause": "LOCATION CONSENT HW-18 covers filming in Riverton Archive Atrium on 8 November 2026.",
              "requestHash": "d2f09d2fcd407cad86715ee9aeb74efcc1621342dfbd5b4692f59b450805c435",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
              "finding": {
                "code": "CLOCKED_SEMANTIC_AMBIGUOUS",
                "title": "Semantic relationship remains uncertain",
                "status": "unresolved",
                "relevance": 0.9744,
                "grant": 0.6549,
                "explanation": "Model probabilities do not support a dependable conclusion. Review the complete documents manually."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.9744
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.6549
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            },
            {
              "index": 2,
              "range": [
                85,
                206
              ],
              "clause": "Pressure-bearing wheeled camera platforms must not cross the original tesserae until written registrar consent is issued.",
              "requestHash": "1d0f512f50227531868bf50d10c06bf0b6383134f5b69234e81f5033f83a01fd",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
              "finding": {
                "code": "CLOCKED_SEMANTIC_REVIEW",
                "title": "Clocked linked an unfamiliar activity to a source condition",
                "status": "review",
                "relevance": 0.9766,
                "grant": 0.0025,
                "explanation": "This may be a restriction or approval prerequisite. The selected excerpt does not establish specific issued permission. Human review required."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.9766
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.0025
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            },
            {
              "index": 3,
              "range": [
                207,
                399
              ],
              "clause": "SIGNED ADDENDUM AD-4 specifically permits Scene 47 to use a rubber-tyred tracking carriage across the mosaic floor only while protective boards and an on-site registrar are present throughout.",
              "requestHash": "0e3103ca74601414d8afdcbb5facab00ae39cc9e6d94623d894d1ce47a72d060",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
              "finding": {
                "code": "CLOCKED_CONDITIONAL_AUTHORITY_REVIEW",
                "title": "Clocked linked the activity to a documented permission",
                "status": "review",
                "relevance": 0.988,
                "grant": 0.9774,
                "explanation": "The excerpt describes a potential issued authorization. Verify signer, scene, date, location and every prerequisite before reliance. Never treat this as clearance."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.988
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.9774
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            },
            {
              "index": 4,
              "range": [
                400,
                530
              ],
              "clause": "The location manager emailed a request to extend the exception to Scene 48, but that message was not issued as a signed amendment.",
              "requestHash": "fca789c6d0b8872219e8be46354d3ccad5974c1b5120c9ec06e64c064dd4a7ee",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "0fb199d799d904f865e254cf697f6c87fae4cdecca857db3c8eda5f1a9b5a505",
              "finding": {
                "code": "NO_SEMANTIC_LINK_DETECTED",
                "title": "No link detected in this selected clause",
                "status": "unresolved",
                "relevance": 0.0471,
                "grant": 0.0021,
                "explanation": "This does not establish unrestricted permission; another relevant clause may have been omitted."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.0471
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.0021
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            }
          ],
          "error": null,
          "notClearance": true,
          "warning": "Results are limited to segmented source clauses; missing findings never imply permission."
        }
      },
      {
        "sceneId": "S48",
        "sceneRow": "Scene 48 | RIVERTON ARCHIVE ATRIUM | 11:10-11:30 | Film a similar travelling shot using a rolling camera platform across the mosaic floor.",
        "sceneHash": "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d",
        "status": "COMPLETE",
        "scan": {
          "source": "live-clocked-decide-condition-sweep",
          "endpoint": "decide",
          "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
          "sceneHash": "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d",
          "scene": {
            "text": "Scene 48 | RIVERTON ARCHIVE ATRIUM | 11:10-11:30 | Film a similar travelling shot using a rolling camera platform across the mosaic floor."
          },
          "candidatesDetected": 4,
          "candidatesEvaluated": 4,
          "attempts": 4,
          "sourceUnscanned": [],
          "complete": true,
          "interpretationScope": "ONLY_SEGMENTED_CLAUSES_NOT_ENTIRE_PERMIT_AUTHORITY",
          "reportedCredits": 4,
          "observedKnownCredits": 4,
          "results": [
            {
              "index": 1,
              "range": [
                0,
                84
              ],
              "clause": "LOCATION CONSENT HW-18 covers filming in Riverton Archive Atrium on 8 November 2026.",
              "requestHash": "3e575a7349e5b0f2b8cfcd3617a40d76a62f0207cc5cf00e31b6722d40354b25",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d",
              "finding": {
                "code": "CLOCKED_CONDITIONAL_AUTHORITY_REVIEW",
                "title": "Clocked linked the activity to a documented permission",
                "status": "review",
                "relevance": 0.9783,
                "grant": 0.8159,
                "explanation": "The excerpt describes a potential issued authorization. Verify signer, scene, date, location and every prerequisite before reliance. Never treat this as clearance."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.9783
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.8159
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            },
            {
              "index": 2,
              "range": [
                85,
                206
              ],
              "clause": "Pressure-bearing wheeled camera platforms must not cross the original tesserae until written registrar consent is issued.",
              "requestHash": "d5d144e97914e7bda14aaabd93ec1592d8370d9c5db3c5cfb211dec2a33b9225",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d",
              "finding": {
                "code": "CLOCKED_SEMANTIC_REVIEW",
                "title": "Clocked linked an unfamiliar activity to a source condition",
                "status": "review",
                "relevance": 0.989,
                "grant": 0.0022,
                "explanation": "This may be a restriction or approval prerequisite. The selected excerpt does not establish specific issued permission. Human review required."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.989
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.0022
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            },
            {
              "index": 3,
              "range": [
                207,
                399
              ],
              "clause": "SIGNED ADDENDUM AD-4 specifically permits Scene 47 to use a rubber-tyred tracking carriage across the mosaic floor only while protective boards and an on-site registrar are present throughout.",
              "requestHash": "5bff98575f695d0e7e41826d449e74c987b7f346a51e120450e2ee1a71c8577a",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d",
              "finding": {
                "code": "CLOCKED_SEMANTIC_REVIEW",
                "title": "Clocked linked an unfamiliar activity to a source condition",
                "status": "review",
                "relevance": 0.9273,
                "grant": 0.01,
                "explanation": "This may be a restriction or approval prerequisite. The selected excerpt does not establish specific issued permission. Human review required."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.9273
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.01
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            },
            {
              "index": 4,
              "range": [
                400,
                530
              ],
              "clause": "The location manager emailed a request to extend the exception to Scene 48, but that message was not issued as a signed amendment.",
              "requestHash": "a3de6f84f46100840b660895ca97e5643cec4d7e995a9cc47225be0c8e7cd8d2",
              "permitHash": "6e1ab1ff894dee81e960a67d5bce23598b64235f9b38851e2faef73e575a034c",
              "sceneHash": "08a36ade26cecdaef2a7b3e25ffc5253adc7ea3a4531f66be3009ceaae64a27d",
              "finding": {
                "code": "CLOCKED_SEMANTIC_REVIEW",
                "title": "Clocked linked an unfamiliar activity to a source condition",
                "status": "review",
                "relevance": 0.9474,
                "grant": 0.0021,
                "explanation": "This may be a restriction or approval prerequisite. The selected excerpt does not establish specific issued permission. Human review required."
              },
              "modelAnswers": {
                "activity_link": {
                  "type": "noul",
                  "noul": 0.9474
                },
                "granted_for_scene": {
                  "type": "noul",
                  "noul": 0.0021
                }
              },
              "reportedCredits": 1,
              "notClearance": true
            }
          ],
          "error": null,
          "notClearance": true,
          "warning": "Results are limited to segmented source clauses; missing findings never imply permission."
        }
      }
    ],
    "totalPlannedCalls": 8,
    "attempts": 8,
    "complete": true,
    "interpretationScope": "SEGMENTED_CLAUSES_PER_SCENE_NOT_COMPLETE_PERMIT_AUTHORITY",
    "reportedCredits": 8,
    "observedKnownCredits": 8,
    "error": null,
    "notClearance": true,
    "warning": "A scene not evaluated or with no model finding is NOT authorized. Resolve authority, conditions and all missing source evidence manually."
  }
};
