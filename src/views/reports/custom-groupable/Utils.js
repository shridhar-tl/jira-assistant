/* eslint-disable no-fallthrough, complexity*/

import { UUID } from "../../../_constants";

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
        case "user":
        case "parent":
        case "thumbnail":
        case "statusCategory":
            obj.knownObj = true;
        case "string":
        case "date":
        case "datetime":
        case "issuerestriction":
            obj.type = type;
            break;
        case "number":
            switch (system) {
                case "timeoriginalestimate":
                case "aggregatetimespent":
                case "aggregatetimeoriginalestimate":
                case "workratio":
                case "timespent":
                case "timeestimate":
                case "aggregatetimeestimate":
                    obj.type = "seconds";
                    break;
                default:
                    obj.type = type;
                    break;
            }
            break;
        case "issuetype":
        case "priority":
        case "project":
        case "progress":
        case "comments-page":
        case "resolution":
        case "securitylevel":
        case "status":
        case "timetracking":
        case "votes":
        case "watches":
            obj.knownObj = true;
            obj.type = system;
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
                switch (items) {
                    case "user":
                        obj.knownObj = true;
                    case "string": // Fallthrough
                    case "date":
                    case "datetime":
                    case "numeric":
                    case "option":
                        obj.type = items || customType;
                        break;
                    default:
                        if (items === 'json' && customType?.indexOf('sprint') > -1) {
                            obj.type = 'sprint';
                        }
                        else {
                            obj.type = customType;
                        }
                        break;
                }
            }
            break;
        default:
            if (customType?.indexOf('epic-link') > -1) {
                obj.type = 'epicLink';
            } else if (customType?.indexOf('epic-status') > -1) {
                obj.type = 'epicStatus';
            } else if (custom) {
                obj.type = customType;
            }
            break;
    }

    return obj;
}
