/* eslint-disable no-fallthrough, complexity*/

import { UUID } from "../../../constants/utils";

export function getField(field) {
    const { id, name, custom,
        schema: {
            system,
            items,
            custom: customType,
            type = (custom ? '(Unsupported)' : id)
        } = {}
    } = field;

    const obj = { id: UUID.generate(), field: id, name, custom, type };

    if (id === "issuekey") {
        obj.type = "string";
        return obj;
    }

    switch (type) {
        case "comments-page": // comments
        case "securitylevel": // security
            obj.knownObj = true;
            obj.type = system;
            break;

        case "option-with-child":
            obj.type = type;
            break;

        case "number":
            switch (system) {
                case "timeoriginalestimate":
                case "aggregatetimespent":
                case "aggregatetimeoriginalestimate":
                case "timespent":
                case "timeestimate":
                case "aggregatetimeestimate":
                    obj.type = "seconds";
                    break;
                case "workratio":
                    obj.type = system;
                    break;
                default:
                    obj.type = type;
                    break;
            }
            break;
        case "array":
            obj.isArray = true;
            if (!field.custom) {
                switch (system) {
                    case "versions":
                    case "fixVersions":
                    case "attachment":
                    case "components":
                    case "issuelinks":
                    case "subtasks":
                        obj.knownObj = true;
                        obj.type = items || system;
                        break;
                    case "worklog":
                        obj.type = items || system;
                        obj.isArray = false;
                        break;
                    case "labels":
                        obj.type = items || system;
                        break;
                    default:
                        obj.type = JSON.stringify(field);
                        break;
                }
            }
            else {
                if (items === 'numeric') {
                    obj.type = items;
                } else if (items === 'json' && customType?.indexOf('sprint') > -1) {
                    obj.type = 'sprint';
                }
                else {
                    const { type: sType, knownObj: sknownObj } = getKnownTypes(items, customType);
                    obj.type = sType;
                    obj.knownObj = sknownObj;
                }
            }
            break;
        default:
            const { type: kType, knownObj: kObj } = getKnownTypes(type, null);

            if (kType) {
                obj.type = kType;
                obj.knownObj = kObj;
            }
            else if (customType?.indexOf('epic-link') > -1) {
                obj.type = 'epicLink';
            } else if (custom) {
                obj.type = customType;
            }
            break;
    }

    return obj;
}

function getKnownTypes(type, defaultType) {
    const obj = {};

    switch (type) {
        case "user":
        case "parent":
        case "thumbnail":
        case "statusCategory":
        case "project":
        case "resolution":
        case "issuetype":
        case "watches":
        case "priority":
        case "status":
        case "progress":
        case "timetracking":
        case "votes":
            obj.knownObj = true;
        case "string":
        case "date":
        case "datetime":
        case "issuerestriction":
        case "option":
            obj.type = type;
            break;

        default:
            obj.type = defaultType;
            break;
    }

    return obj;
}