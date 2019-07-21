
function initialize() {

    fieldCanvas = document.getElementById('windowCanvas');
    fieldContext = fieldCanvas.getContext('2d');

    windowDiv = document.getElementById('windowDiv');
    windowDiv.addEventListener('dragover', handleDragOver, false);
    windowDiv.addEventListener('drop', handleFileSelect, false);

    creatorToolbar = document.getElementById('toolBar');
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    autonCreatorInit();
    loop();

    windowDiv.scrollTop = windowDiv.scrollHeight;
}

function loop() {
    updateInput();

    document.getElementById("connect-to-robot-button").style.background = connectedToRobot()?'#00e600':'#ee0000';
    document.getElementById("connect-to-robot-button").style.color = connectedToRobot()?'#000000':'#ffffff';
    document.getElementById("connect-to-robot-button").innerText = connectedToRobot()?"Connected to Robot":"Connect to Robot";

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    fieldContext.clearRect(0, 0, windowWidth, windowHeight);
    fieldContext.rect(0, 0, windowWidth, windowHeight);

    autonCreatorDataLoop();
    autonCreatorDrawLoop();

    requestAnimationFrame(loop);
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var file = evt.dataTransfer.files[0];
    var read = new FileReader();
    read.readAsText(file);

    read.onloadend = function(){
        console.log(read.result);
		loadPath(read.result);
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}