$(function() {
  //FEATURE high-score

  //models
  var snake;
  var star = {
    active: false
  };

  //states
  var positionHead = {};
  var direction = {};
  var isMoving;
  var lostAlready;
  var steeredAlready;
  var firstStar;

  //Intervals and Timeouts
  var starFirstTimeout;
  var moveInterval;
  var starInterval;
  var starRemoveTimeout;
  var tick = 250;

  //settings
  var gridSize = {
    x: 12,
    y: 10
  };
  var blockSize = 60;
  var speedFactor = 1;

  //initial settings
  var initialSnakeLength = 3;
  var initialX = Math.floor(gridSize.x/2);
  var initialY = Math.floor(gridSize.y/2);
  var initialPositionHead = {
    x: initialX,
    y: initialY
  };
  var initialDirection = {
    x: 0,
    y: 0
  };

  //-------------------------------------------------------
  //---------- handling the settings ----------------------
  //-------------------------------------------------------

  //REFACTOR I see no other way than defining the width
  //of the other elements plus some padding here
  var marginX = 400;
  var marginY = 60;
  function initializeSettings() {
    setMaxGridValues();

    setMaxBoxSizeValue();
  }
  initializeSettings();

  function setMaxGridValues() {
    maxGridSizeX = maxGridSize(window.innerWidth, marginX);
    if (gridSize.x > maxGridSizeX) gridSize.x = maxGridSizeX;
    setMaxValue('#grid-size-x-range', maxGridSizeX);
    maxGridSizeY = maxGridSize(window.innerHeight, marginY);
    if (gridSize.y > maxGridSizeY) gridSize.y = maxGridSizeY;
    setMaxValue('#grid-size-y-range', maxGridSizeY);

    updateSettingTexts();
  }

  function setMaxBoxSizeValue() {
    maxBoxSize = getMaxBoxSize();
    setMaxValue('#block-size-range', maxBoxSize);
  }

  function maxGridSize(pixels, margin) {
    return Math.floor(maxPlayingFieldSize(pixels, margin) / blockSize);
  }

  function maxPlayingFieldSizeX() {
    return window.innerWidth - marginX;
  }

  function maxPlayingFieldSizeY(pixels, margin) {
    return window.innerHeight - marginY;
  }

  function maxPlayingFieldSize(pixels, margin) {
    return pixels - margin;
  }

  function setMaxValue(range, value) {
    $(range).attr('max', value);
  }

  function getMaxBoxSize() {
    return Math.floor(Math.min(maxPlayingFieldSizeX() / gridSize.x / 10,
                               maxPlayingFieldSizeY() / gridSize.y / 10)) * 10;
  }

  function updateSettingTexts() {
    $('#playing-field-settings').find('input[type=range]').each(function() {
      printValue($(this), $($(this).data('textfield')));
    });
  }

  function setPlayingFieldSetting() {
    gridSize.x = $('#grid-size-x-range').val();
    gridSize.y = $('#grid-size-y-range').val();
    blockSize = $('#block-size-range').val();
    setMaxGridValues();

    drawPlayingFieldContainer();
    drawPlayingField();
    initializeGame();
  }

  $('#playing-field-settings').find('input[type=range]').change(setPlayingFieldSetting);

  //REFACTOR I could also do it with this:
  //http://stackoverflow.com/a/5926068
  $(window).resize(setPlayingFieldSetting);


  function setSpeedFactor() {
    var exponent = $(this).val();
    speedFactor = Math.round(Math.pow(2, exponent)*100)/100;
    $('#speed-text').text(speedFactor);

    //restart Snake to apply new speed
    if (isMoving) {
      stopMoving();
      startMoving();
    }
  }
  $('#speed-range').change(setSpeedFactor);

  function setSpeedFromKeys(e) {
    if (e.which === 187
        || e.which === 189) {
      speedRange = $('#speed-range');
      speedExponent = speedRange.val();
      speedRange.val(parseInt(speedExponent) - e.which + 188);
      speedRange.change();
    }
  }
  $(document).keydown(setSpeedFromKeys);

  //-------------------------------------------------------
  //---------- setting up the game ------------------------
  //-------------------------------------------------------

  function drawPlayingFieldContainer() {
    var container = $('#playing-field-container');
    width = maxPlayingFieldSizeX();
    height = maxPlayingFieldSizeY();
    container.css({
      'flex-basis': width,
      height: height
    });
  }
  drawPlayingFieldContainer();

  function drawPlayingField() {
    var container = $('#playing-field');
    width = gridSize.x * blockSize;
    height = gridSize.y * blockSize;
    container.css({
      width: width,
      height: height
    })
  }
  drawPlayingField();

  function initializeGame() {
    lostAlready = false;
    firstStar = true;
    snake = [];

    positionHead.x = initialPositionHead.x;
    while (positionHead.x >= gridSize.x) {
      if (gridSize.x == 1) break;
      positionHead.x = Math.round(positionHead.x/2);
    }
    positionHead.y = initialPositionHead.y;
    while (positionHead.y >= gridSize.y) {
      if (gridSize.y == 1) break;
      positionHead.y = Math.round(positionHead.y/2);
    }
    direction.x = initialDirection.x;
    direction.y = initialDirection.y;
    var container = $('#playing-field');
    container.html('');
    for(var i = 0; i < initialSnakeLength; i++) addBodyPart();

    hideLostMessage();
  }
  initializeGame();

  //-------------------------------------------------------
  //---------- handling the snake ----------------------------
  //-------------------------------------------------------
  function addBodyPart() {
    var i = snake.length;
    bodyPart = $('<div id="body-' + i + '" class="body-part"></div>').appendTo('#playing-field');
    bodyPart.css({
      width: blockSize,
      height: blockSize
    })

    if(i === 0) {
      setCSSCoordinates(bodyPart, gridToCSS(positionHead));
    } else {
      //take the coordinates from the previous element
      previousCoordinates = getCSSCoordinates(snake[i - 1]);
      setCSSCoordinates(bodyPart, previousCoordinates);
    }

    snake.push(bodyPart);
  }

  function moveSnake() {
    //REFACTOR this function is a mess
    positionHead.x += direction.x;
    positionHead.y += direction.y;

    if(hitWall() || hitItself()) {
      stopMoving();
      lostAlready = true;
      reddenHead();
      showLostMessage();
      return
    }

    if (hitStar()) eatStar();

    var previousElementCoordinates = getCSSCoordinates(snake[0]);
    moveHead();

    for(var i = 1; i < snake.length; i++) {
      currentElementCoordinates = getCSSCoordinates(snake[i]);
      //skip if the previous element has been overlapping this one
      //i.e. at the start or when adding body parts
      if (previousElementCoordinates.top === currentElementCoordinates.top
          && previousElementCoordinates.left === currentElementCoordinates.left ) continue;

      currentElementCoordinates.top = previousElementCoordinates.top;
      currentElementCoordinates.left = previousElementCoordinates.left;
      previousElementCoordinates = getCSSCoordinates(snake[i]);
      setCSSCoordinates(snake[i], currentElementCoordinates);
    }
    steeredAlready = false;
  }

  function startMoving() {
    if (firstStar) {
      starFirstTimeout = setTimeout(drawStar, 2000);
      firstStar = false;
    }
    isMoving = true;
    moveInterval = setInterval(moveSnake, moveIntervalDuration());
    startDrawingStars();
  }

  function moveIntervalDuration() {
    return tick*(1/speedFactor);
  }

  function stopMoving() {
    clearInterval(moveInterval);
    stopDrawingStars();
    clearTimeout(starRemoveTimeout);
    isMoving = false;
  }

  function reddenHead() {
    snake[0].css('background-color', 'BD5555');
  }

  function blinkHead() {
    snake[0].css('background-color', 'DDD')
    setTimeout(function() {snake[0].css('background-color', '')}, 150);
  }

  function hitWall() {
    if( positionHead.x < 0
       || positionHead.x >= gridSize.x
       || positionHead.y < 0
       || positionHead.y >= gridSize.y) {
       return true
     } else {
       return false
     }
  }

  function hitItself() {
    return overlapsBody(positionHead)
  }

  function hitStar() {
    return positionHead.x === star.x && positionHead.y === star.y
  }

  function moveHead() {
    setCSSCoordinates(snake[0], gridToCSS(positionHead));
  }

  //-------------------------------------------------------
  //---------- menu on the right --------------------------
  //-------------------------------------------------------
  function showLostMessage() {
    $('#lost').css({visibility: 'visible'});
  }

  function hideLostMessage() {
    $('#lost').css({visibility: 'hidden'});
  }

  //-------------------------------------------------------
  //---------- controls -----------------------------------
  //-------------------------------------------------------
  function steerSnake(e) {
    if (lostAlready) return
    if (steeredAlready) {
      blinkHead();
      return;
    }
    //REFACTOR the repeated assignment of steeredAlready is annoying
    if(e.which == '37'
       && direction.x !== 1) {
      direction = {
        x: -1,
        y: 0
      };
      steeredAlready = true;
    } else if(e.which == '38'
              && direction.y !== 1) {
      direction = {
        x: 0,
        y: -1
      };
      steeredAlready = true;
    } else if(e.which == '39'
              && direction.x !== -1) {
      direction = {
        x: 1,
        y: 0
      };
      steeredAlready = true;
    } else if(e.which == '40'
              && direction.y !== -1) {
      direction = {
        x: 0,
        y: 1
      };
      steeredAlready = true;
    }
  }
  $(document).keydown(steerSnake);

  function startAndStopSnake(e) {
    // start and pause with space
    if (e.which === 32
        && (direction.x !== 0
            || direction.y !== 0)) {
      if (isMoving) {
        stopMoving();
      } else {
        startMoving();
      }
    }
    // start with arrows
    if ([37, 38, 39, 40].indexOf(e.which) !== -1) {
      if(!isMoving
         && !lostAlready){
        startMoving();
      }
      //Prevent the sliders to change
      //when they have been selected before
      e.preventDefault();
    }
  }
  //REFACTOR this is not compatible with IE (prior 8?)
  //see also http://stackoverflow.com/a/17249184
  $(document).get(0).addEventListener('keydown', startAndStopSnake, true);

  function reinitialize(e) {
    if (lostAlready && e.which === 13)
      initializeGame();
  }
  $(document).keydown(reinitialize);

  $('#retry').click(initializeGame);

  //-------------------------------------------------------
  //---------- handling the stars -------------------------
  //-------------------------------------------------------
  function drawStar() {
    clearTimeout(starRemoveTimeout);
    do {
      star.x = Math.floor(Math.random() * (gridSize.x -1));
      star.y = Math.floor(Math.random() * (gridSize.y - 1));
    }
    while (overlapsBody(star) || hitStar())

    starContainer = $('#star-container');
    if (starContainer.length === 0) starContainer = createStarContainer();
    starContainer.css('visibility', 'visible');
    setCSSCoordinates(starContainer, gridToCSS(star));
    star.active = true;

    starRemoveTimeout = setTimeout(removeStar, keepStarTick());
  }

  function drawStarDuration() {
    //TODO when you increase the speed this seems to get to fast..
    return moveIntervalDuration() * (gridSize.x + gridSize.y);
  }

  function keepStarTick() {
    return drawStarDuration() * 0.8;
  }

  function startDrawingStars() {
    starInterval = setInterval(drawStar, drawStarDuration());
  }

  function stopDrawingStars() {
    clearInterval(starInterval);
    clearTimeout(starFirstTimeout);
  }

  function createStarContainer() {
    starContainer = $('<div id="star-container"><span id="star">*</span></div>').appendTo($('#playing-field'));
    starContainer.css({
      width: blockSize,
      height: blockSize,
      visibility: 'hidden',
      'font-size': blockSize
    });
    //kind of a hack..
    $('#star').css({'line-height': 1.5*blockSize + 'px'});
    return starContainer
  }

  function removeStar() {
    star.active = false;
    starContainer.css({visibility: 'hidden'});
  }

  function eatStar() {
    removeStar();
    addBodyPart();
    clearInterval(starInterval);
    drawStar();
    startDrawingStars();
  }

  //-------------------------------------------------------
  //---------- utility functions --------------------------
  //-------------------------------------------------------
  function overlapsBody(gridPosition) {
    for(var i = 1; i < snake.length; i++) {
      cssCoordinates = gridToCSS(gridPosition);
      bodyPartCoordinates = getCSSCoordinates(snake[i]);
      if ( cssCoordinates.top + 'px' == bodyPartCoordinates.top
          && cssCoordinates.left + 'px' == bodyPartCoordinates.left) return true
    }
    return false
  }

  function gridToCSS(gridPosition) {
    leftValue = gridPosition.x * blockSize;
    topValue = gridPosition.y * blockSize;
    cssPosition = {
      left: leftValue,
      top: topValue
    }
    return cssPosition
  }

  function setCSSCoordinates(element, coordObj) {
    element.css(coordObj);
  }

  function getCSSCoordinates(element) {
    var coordinates = {};
    coordinates.top = element.css('top');
    coordinates.left = element.css('left');
    return coordinates;
  }

  function printValue(sourceElement, printElement) {
    printElement.text(sourceElement.val());
  }
});
