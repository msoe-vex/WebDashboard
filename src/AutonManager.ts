import { Path } from "./Path.js";
import { Point } from "./Spline.js";
import { Waypoint } from "./Waypoint.js";

export enum WaypointAction {
    MOVE,
    ROTATE,
    SPLINE_ROTATE,
    NONE
};

export class AutonCreator {
    fieldImage: HTMLImageElement;
    robotImage: HTMLImageElement;
    ratio: number;
    ws: WebSocket;
    selectedWaypointIndex: number;
    selectedWaypoint: Waypoint;
    isWaypointSelected: boolean;
    path: Path?;
    paths: Path[];
    sharedWaypoints: Waypoint[];
    robotWidth: number;
    robotLength: number;
    robotName: string;
    isTank: boolean;
    savedIsTank: boolean;
    selectedPath: number?;
    lastSelectedPath: number?;
    waypointAction: WaypointAction;

    constructor() {
        this.ratio = 1;
        this.isWaypointSelected = false;
        this.path = null;
        this.robotWidth = 0;
        this.robotLength = 0;
        this.robotName = "";
        this.isTank = true;
        this.savedIsTank = this.isTank;
        this.selectedPath = null;
        this.lastSelectedPath = null;
        this.waypointAction = WaypointAction.NONE;
    }

    /**
     * Adds new path to the path selector
     * @param path
     */
    addPath(path: Path) {
        this.paths.push(path);
        let index = this.paths.length - 1;
        $('#pathSelector').append($('<option/>', {
            value: index
        }).text(path.name).attr('selected','selected'));

        // /**
        //  * Allows user to change the selected path
        //  */
        // $('#pathSelector').on('change', function () {
        //     selectedPath = this.value;
        // });

        return index;
    }

    getFieldMousePos () {
        return this.fieldMousePos;
    }

    /**
     * Creates a new path
     */
    export const newPath = () => {
        let name = prompt("Name the Path");
        let path = new Path(name, maxVel, maxAccel, k);
        path.newWaypoint(20, 10, 0, 0, "start", 0);
        path.newWaypoint(30, 70, 0, 0, "end", undefined);
        selectedPath = addPath(path);
    }

    /**
     * Switches the drive mode of all paths
     * Toggle button in the config menu
     */
    export const setSwerve = () => {
        if (isTank) {
            $("#swerveTankToggle").text("Swerve Drive");
        } else {
            $("#swerveTankToggle").text("Tank Drive");
        }
        isTank = !isTank;
    }

    /**
     * Creates a new waypoint in the current path
     * Called when the 'New Waypoint' button is pressed
     * @param x - starting x position
     * @param y - starting y position
     * @param angle - starting angle of robot
     * @param spline_angle - starting angle of spline
     * @param name - name of the waypoint
     * @param speed - speed of the waypoint
     * @param shared - true if waypoint is shared
     */
    export const newWaypoint = () => {
        path.newWaypoint();
    }

    /**
     * Creates a new shared waypoint
     * Called when the 'New Shared Waypoint' button is pressed
     */
    export const newSharedWaypoint = () => {
        // Creates new shared waypoint with button
        let name = prompt("Shared Waypoint Name");
        if (name !== null) {
            let newShared = path.newWaypoint(undefined, undefined, undefined, undefined, name, undefined, true);
            sharedWaypoints.push(newShared);
            newSharedButton(name);
        }
    }

    /**
     * Creates a new button for a shared waypoint
     * @param name - name of the new button
     */
    export const newSharedButton = (name) => {
        let buttonList = $("#waypointsList");
        let button = $("<button>" + name + "</button>");
        // Function runs if dynamically created shared waypoint button is pressed
        const clickShared = (name)  => {
            let inPath = false;
            path.getWaypoints().forEach(function(point) {
                if (point.name === name && point.shared) {
                    inPath = true;
                }
            })
            if (inPath === false) {
                sharedWaypoints.forEach(function(point) {
                    if (name === point.name) {
                        path.newWaypoint(point.x, point.y, point.angle, point.spline_angle, name, undefined, true);
                    }
                })
            }
        };
        button.attr("type", "button");
        button.attr("class", "sharedWaypoint btn btn-block btn-secondary");
        button.attr("data-trigger", "hover");
        button.attr("data-toggle", "popover");
        button.click(() => clickShared(name));
        buttonList.append(button);
    }

    /**
     * Loads in all shared waypoints when a JSON file is added
     */
    export const loadSharedButtons = () => {
        sharedWaypoints.forEach(function (point) {
            newSharedButton(point.name);
        })
    }

    /**
     * Removes the selected by waypoint
     * Called when the 'Remove Waypoint' button is pressed
     */
    export const removeWaypoint = () => {
        if (path.getNumWaypoints() > 0) {
            if (isWaypointSelected) {
                path.removeWaypoint(selectedWaypointIndex);
                if (path.getNumWaypoints() === 0) {
                    selectedWaypointIndex = -1;
                    isWaypointSelected = false;
                } else if (path.getNumWaypoints() === selectedWaypointIndex) {
                    selectedWaypointIndex--;
                }
            } else {
                path.removeWaypoint();
            }
        }
    }

    /**
     * Initialized the first path and images
     */
    export const autonCreatorInit = () => {
        //connectToRobot();
        let firstPath = new Path("TestPath", maxVel, maxAccel, k); //TODO: Make it so these can be changed on the GUI, also save them in the json output so they can be loaded later
        addPath(firstPath);
        fieldImage.src = "images/field.png";
        robotImage.src = "images/robot.png";
        firstPath.newWaypoint(0, 7.5, 0, 0, "startWaypoint", 0);
        firstPath.newWaypoint(0, 71, 0, 0, "endWaypoint", undefined);
        selectedPath = 0;
        $("#x-value").keyup(function(){
            let x = this.value;
            if(!isNaN(x)) {
                const num = parseFloat(x);
                if (num >= -70 && num <= 70) {
                    selectedWaypoint.x = num;
                }
            }
        });
        $("#y-value").keyup(function(){
            let y = this.value;
            if(!isNaN(y)) {
                const num = parseFloat(y);
                if (num >= 0 && num <= 140) {
                    selectedWaypoint.y = num;
                }
            }
        });
    }

    /**
     * Loads the configuration data into the popup
     */
    export const loadConfig = () => {
        $("#robotLength").val(robotLength);
        $("#robotWidth").val(robotWidth);
        $("#robotName").val(robotName);
        isTank = savedIsTank;
        $("#swerveTankToggle").text(isTank ? "Tank Drive" : "Swerve Drive");
    }

    /**
     * Saves the new configurations
     */
    export const saveConfig = () => {
        robotLength = $("#robotLength").val();
        robotWidth = $("#robotWidth").val();
        robotName = $("#robotName").val();
        savedIsTank = isTank;
        $("#myModal").modal("hide");
    }

    /**
     * This function loads the waypoint configuration into the interface
     */
    export const loadWaypointConfig = () => {
        $("#waypointName").val(selectedWaypoint.name);
        $("#waypointSpeed").val(selectedWaypoint.speed);
    }

    /**
     * This function saves a new waypoint configuration to the current waypoint
     */
    export const saveWaypointConfig = () => {
        let previousName = selectedWaypoint.name;
        let newName = $("#waypointName").val();
        let newSpeed = $("#waypointSpeed").val();

        if (newName) {
            selectedWaypoint.name = newName;

            if (selectedWaypoint.shared) {
                // Update global shared waypoint
                sharedWaypoints.forEach(function (point) {
                    if (previousName === point.name) {
                        point.name = newName;
                    }
                })

                // Update shared waypoints in every path
                for (let i in paths) {
                    if (i !== selectedPath) {
                        let otherPath = paths[i];
                        let otherWaypointIndex = otherPath.getWaypointIndexByName(previousName);

                        if (otherWaypointIndex !== undefined) {
                            let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);
                            otherWaypoint.name = newName;
                        }
                    }
                }

                // Update button
                let buttonList = $(".sharedWaypoint");
                buttonList.each(function(index) {
                    let oldName = $(this).text();
                    if (oldName === previousName) {
                        $(this).text(newName);
                    }
                });
            }
        }

        if (newSpeed) {
            selectedWaypoint.speed = parseFloat(newSpeed);
        } else {
            selectedWaypoint.speed = undefined;
        }

        paths[selectedPath].regeneratePath();
    }

    /**
     * Updates the selected path when actions are done to the selected waypoint
     */
    export const autonCreatorDataLoop = () => {
        let fieldHeightPxl = windowHeight;
        const xinput = $("#x-value");
        const yinput = $("#y-value");

        ratio = fieldHeightPxl / fieldWidthIn * (fieldImage.height / fieldImage.width);

        if (lastSelectedPath !== selectedPath) {
            path = paths[selectedPath];
            selectedWaypointIndex = -1;
            isWaypointSelected = false;
            waypointAction = WaypointAction.NONE;
        }

        lastSelectedPath = selectedPath;

        if (fieldMouseRising.l && isWaypointSelected && path.getClosestWaypoint(fieldMousePos, robotWidthIn / 2) === selectedWaypointIndex) {
            waypointAction = WaypointAction.MOVE;
        } else if (fieldMouseRising.r && isWaypointSelected && path.getClosestWaypoint(fieldMousePos, robotWidthIn / 2) === selectedWaypointIndex) {
            waypointAction = WaypointAction.ROTATE;
        } else if (fieldMouseRising.l) {
            let selectedIndex = path.getClosestWaypoint(fieldMousePos, robotWidthIn / 2);
            if (selectedIndex >= 0) {
                //Select a waypoint
                selectedWaypointIndex = selectedIndex;
                isWaypointSelected = true;
                selectedWaypoint = path.getWaypoint(selectedWaypointIndex);
                xinput.prop("disabled", false);
                yinput.prop("disabled", false);
                xinput.val(selectedWaypoint.x);
                yinput.val(selectedWaypoint.y);
                loadWaypointConfig();
                $("#nameWaypointButton").prop("disabled", false);
            } else {
                //Deselect waypoint
                selectedWaypointIndex = undefined;
                isWaypointSelected = false;
                selectedWaypoint = undefined;
                xinput.val("");
                yinput.val("");
                xinput.prop("disabled", true);
                yinput.prop("disabled", true);
                $("#nameWaypointButton").prop("disabled", true);
            }
            waypointAction = WaypointAction.NONE;
        } else if (fieldMouseFalling.l || fieldMouseFalling.r || !isWaypointSelected) {
            waypointAction = WaypointAction.NONE;
        }

        // update data
        let mousePos = pixelsToInches(fieldMousePos);

        switch (waypointAction) {
            case WaypointAction.MOVE:
                selectedWaypoint.x = mousePos.x;
                selectedWaypoint.y = mousePos.y;
                xinput.val(selectedWaypoint.x);
                yinput.val(selectedWaypoint.y);
                fieldCanvas.style.cursor = cursors.move;
                break;
            case WaypointAction.ROTATE:
                let angle1 = toDegrees(Math.atan2((mousePos.x - selectedWaypoint.x), (mousePos.y - selectedWaypoint.y)));

                if (fieldKeyboard.control) {
                    angle1 = Math.round(angle1 / 15) * 15;
                }

                // Move spline only
                if (fieldKeyboard.shift && !savedIsTank) {
                    // Swerve - Update spline only with right click shift
                    selectedWaypoint.spline_angle = angle1;
                } else if (!savedIsTank) {
                    // Swerve - Update Robot only with right click
                    selectedWaypoint.angle = angle1;
                } else {
                    // Tank - Update both spine and robot angles
                    selectedWaypoint.angle = angle1;
                    selectedWaypoint.spline_angle = angle1;
                }
                fieldCanvas.style.cursor = cursors.crosshair;
                break;
            case WaypointAction.NONE:
                fieldCanvas.style.cursor = cursors.default;
                break;
        }
    }

    export const perc2color = (perc) => {
        perc *= 100;
        let r, g, b = 0;
        if (perc < 50) {
            r = 255;
            g = Math.round(5.1 * perc);
        } else {
            g = 255;
            r = Math.round(510 - 5.10 * perc);
        }
        let h = r * 0x10000 + g * 0x100 + b * 0x1;
        return '#' + ('000000' + h.toString(16)).slice(-6);
    }

    /**
     * Draws the updated path when actions are done to the selected waypoint
     * Also draws ghosts of any shared waypoints being changed
     */
    export const autonCreatorDrawLoop = () => {
        let robotWidthPxl = robotWidthIn * ratio;
        let robotHeightPxl = robotWidthPxl * (robotImage.height / robotImage.width);
        let robotCenterPxl = robotCenterIn * ratio;
        let fieldWidthPxl = fieldWidthIn * ratio;
        let fieldHeightPxl = fieldWidthPxl * (fieldImage.height / fieldImage.width);

        fieldContext.canvas.width = fieldWidthPxl;
        fieldContext.canvas.height = fieldHeightPxl;

        let smallScreen = parseInt(windowWidth) < fieldWidthPxl;
        $("#windowDiv").toggleClass("justify-content-center", !smallScreen).toggleClass("justify-content-start", smallScreen);

        fieldContext.drawImage(fieldImage, 0, 0, fieldWidthPxl, fieldHeightPxl);

        if (isWaypointSelected) {
            // document.getElementById("statusBarXY").innerText = "X: " + selectedWaypoint.x.toFixed(1)
            //     + " Y: " + selectedWaypoint.y.toFixed(1) + " Angle: " + selectedWaypoint.angle.toFixed(2)
            //     + " Name: " + selectedWaypoint.name;
        } else {
            let mousePos = pixelsToInches(fieldMousePos);
            // document.getElementById("statusBarXY").innerText = "X: " + mousePos.x.toFixed(1)
            //     + " Y: " + mousePos.y.toFixed(1);
        }

        if (waypointAction === WaypointAction.ROTATE) {
            fieldContext.fillStyle = "#ffffff";
            if (fieldKeyboard.shift) {
                fieldContext.fillText((selectedWaypoint.spline_angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
                    fieldMousePos.y - 8);
            } else {
                fieldContext.fillText((selectedWaypoint.angle.toFixed(1) + "\xB0"), fieldMousePos.x + 8,
                    fieldMousePos.y - 8);
            }
        }

        if (path.getNumWaypoints() > 0) {
            // Draw waypoints
            let waypoints = path.getWaypoints();

            for (let i in waypoints) {
                let waypoint = waypoints[i];
                let waypointPos = inchesToPixels(new point(waypoint.x, waypoint.y));
                let waypointRotation = waypoint.angle;
                fieldContext.save();
                fieldContext.translate(waypointPos.x, waypointPos.y);
                fieldContext.rotate(toRadians(waypointRotation + 90));

                // Add highlight to currently selected waypoint
                if (parseInt(i) === selectedWaypointIndex) {
                    fieldContext.shadowBlur = 10;
                    fieldContext.shadowColor = 'white';
                }

                fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
                fieldContext.restore();
            }
        }

        // Draw spline
        let points;
        if (waypointAction !== WaypointAction.NONE) {
            points = path.getPoints(selectedWaypointIndex);
        } else {
            points = path.getPoints();
        }

        if (points.length !== 0) {
            fieldContext.lineWidth = Math.floor(robotWidthPxl * .05);

            for (let i = 1; i < points.length; i++) {
                let lastPointInPixels = inchesToPixels(points[i - 1]);
                let currentPointInPixels = inchesToPixels(points[i]);
                fieldContext.beginPath();
                fieldContext.strokeStyle = perc2color(points[i].speed / path.getMaxVel());
                fieldContext.moveTo(lastPointInPixels.x, lastPointInPixels.y);
                fieldContext.lineTo(currentPointInPixels.x, currentPointInPixels.y);
                fieldContext.stroke();
            }
        }

        // Draw ghost of other path if the changing point is shared
        if (waypointAction !== WaypointAction.NONE && selectedWaypoint.shared && isWaypointSelected) {
            let sharedIndex = -1;
            sharedWaypoints.forEach(function (point, index) {
                if (selectedWaypoint.name === point.name) {
                    sharedIndex = index;
                }
            })
            for (let i in paths) {
                if (i !== selectedPath) {
                    let otherPath = paths[i];
                    let otherWaypointIndex = otherPath.getWaypointIndexByName(selectedWaypoint.name);

                    if (otherWaypointIndex !== undefined) {
                        let otherWaypoint = otherPath.getWaypoint(otherWaypointIndex);

                        otherWaypoint.x = selectedWaypoint.x;
                        otherWaypoint.y = selectedWaypoint.y;
                        otherWaypoint.angle = selectedWaypoint.angle;
                        sharedWaypoints[sharedIndex].x = selectedWaypoint.x;
                        sharedWaypoints[sharedIndex].y = selectedWaypoint.y;
                        sharedWaypoints[sharedIndex].angle = selectedWaypoint.angle;
                        if (isTank) {
                            otherWaypoint.spline_angle = selectedWaypoint.spline_angle;
                            sharedWaypoints[sharedIndex].spline_angle = selectedWaypoint.spline_angle;
                        }

                        if (otherPath.getNumWaypoints() > 0) {
                            // Draw waypoints
                            let waypoints = otherPath.getWaypoints();

                            for (let waypoint of waypoints) {
                                let waypointPos = inchesToPixels(new point(waypoint.x, waypoint.y));
                                let waypointRotation = waypoint.angle;
                                fieldContext.save();
                                fieldContext.translate(waypointPos.x, waypointPos.y);
                                fieldContext.rotate(toRadians(waypointRotation + 90));
                                fieldContext.globalAlpha = 0.5;
                                fieldContext.drawImage(robotImage, Math.floor(-robotWidthPxl * .5), Math.floor(-robotCenterPxl), Math.floor(robotWidthPxl), Math.floor(robotHeightPxl));
                                fieldContext.restore();
                            }
                        }

                        // Draw spline
                        let points = otherPath.getPoints(otherWaypointIndex);

                        fieldContext.save();

                        if (points.length !== 0) {
                            fieldContext.lineWidth = Math.floor(robotWidthPxl * .05);
                            fieldContext.strokeStyle = "#d9d9d9";
                            fieldContext.globalAlpha = 0.5;

                            let pointInPixels = inchesToPixels(points[0]);
                            fieldContext.moveTo(pointInPixels.x, pointInPixels.y);
                            fieldContext.beginPath();

                            for (let point of points) {
                                let pointInPixels = inchesToPixels(point);
                                fieldContext.lineTo(pointInPixels.x, pointInPixels.y);
                            }

                            fieldContext.stroke();
                        }
                        fieldContext.restore();
                    }
                }
            }
        }
    }

    /**
     * Outputs every path in current window to json format
     */
    export const pathAsText = () => {
        let output = {
            sharedWaypoints: sharedWaypoints,
            robot: {
                robotName,
                robotWidth,
                robotLength,
                savedIsTank
            },
            paths: paths
        };
        let json = JSON.stringify(output, null, 4);
        console.log("Path: ");
        console.log(json);
        return json;
    }

    /**
     * Exports the path to json and saves it
     */
    export const exportPath = () => {
        var file = new File([pathAsText(true)], "path.json", {type: "text/plain;charset=utf-8"});
        saveAs(file);
    }

    export const sendPath = () => {
        ws.send(pathAsText());
    }

    /**
     * Loads a path from a json file
     * @param path - json path data
     */
    export const loadPath = (path) => {
        let json = JSON.parse(path);
        paths = [];
        $('#pathSelector').empty();
        robotLength = json.robot.robotWidth;
        robotWidth = json.robot.robotWidth;
        robotName = json.robot.robotName;
        isTank = json.robot.savedIsTank;
        savedIsTank = json.robot.savedIsTank;
        sharedWaypoints = json.sharedWaypoints;
        loadConfig();
        for (let path of json.paths) {
            addPath(Path.fromJson(path));
        }
        loadSharedButtons();
        //console.log("Loaded paths: ");
        //console.log(paths);
        lastSelectedPath = -1;
    }

    export const connectedToRobot = () => {
        if (ws) {
            return ws.readyState === ws.OPEN;
        } else {
            return false;
        }

    }

    export const connectToRobot = () => {
        if (location.protocol !== 'https:') {
            ws = new WebSocket('ws://' + document.location.host + '/path');
            if (!(ws.readyState === ws.CONNECTING || ws.readyState === ws.OPEN)) {
                console.log("Can not connect to: " + 'ws://' + document.location.host + '/path');
                ws = new WebSocket('ws://10.20.62.2:5810/path');
            }
        }
    }
}


/**
 * Converts the field inches to pixels on the screen
 * @param pointInInches - point in inches
 * @returns {point} - new point in pixels
 */
 export const inchesToPixels = (pointInInches) => {
    function in2pxX(fieldInches) {
        return (fieldInches + (fieldWidthIn / 2)) * ratio;
    }

    function in2pxY(fieldInches) {
        return fieldInches * ratio;
    }

    return new Point(in2pxY(pointInInches.y), in2pxX(pointInInches.x));
}

/**
 * Converts number of pixels to field inches
 * @param pointInPixels - point in pixels
 * @returns {point} - new point in inches
 */
 export const pixelsToInches = (pointInPixels) => {
    function px2inY(px) {
        return px / ratio;
    }

    function px2inX(px) {
        return (px / ratio) - (fieldWidthIn / 2);
    }

    return new Point(px2inX(pointInPixels.y), px2inY(pointInPixels.x));
}