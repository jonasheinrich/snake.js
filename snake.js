$(function() {
  //FEATURE high-score
  //FEATURE input for gridSize, blockSize, speed (tick) etc?

  //attributes
  var snake;
  var positionHead = {};
  var direction = {};
  var star = {
    active: false
  }

  //states
  var isMoving;
  var lostAlready;
  var steeredAlready;
  var firstStar;

  //Intervals and Timeouts
  var starFirstTimeout;
  var moveInterval;
  var starInterval;
  var starRemoveTimeout;
  var tick;

  //settings
  //FEATURE compute max-gridSize from viewport?
  var gridSize = {
    x: 12,
    y: 10
  };
  var blockSize = 60;

  //initial settings
  var initialSnakeLength = 3;
  var initialX = Math.floor(gridSize.x/2);
  var initialY = Math.floor(gridSize.y/2);
  var initialPositionHead = {
    x: initialX,
    y: initialY
  }
  var initialDirection = {
    x: 0,
    y: 0
  };
  var initialTick = 250;

  //-------------------------------------------------------
  //---------- setting up the game ------------------------
  //-------------------------------------------------------
  function initialize() {
    lostAlready = false;
    firstStar = true;
    snake = [];
    tick = initialTick;

    positionHead.x = initialPositionHead.x;
    positionHead.y = initialPositionHead.y;
    direction.x = initialDirection.x;
    direction.y = initialDirection.y;
    var container = $('#container');
    width = gridSize.x * blockSize;
    height = gridSize.y * blockSize;
    container.css({
      width: width,
      height: height
    })
    container.html('');
    for(var i = 0; i < initialSnakeLength; i++) addBodyPart();

    createLostMessage();
    hideLostMessage();
  }
  initialize();

  //-------------------------------------------------------
  //---------- handling the snake ----------------------------
  //-------------------------------------------------------
  function addBodyPart() {
    var i = snake.length;
    bodyPart = $('<div id="body-' + i + '" class="body-part"></div>').appendTo(container);
    bodyPart.css({
      width: blockSize,
      height: blockSize,
      position: 'absolute'
    })

    if(i === 0) {
      bodyPart.css(gridToCSS(positionHead));
    } else {
      //take the coordinates from the previous element
      previousCoordinates = getCSSCoordinates(snake[i - 1]);
      setCSSCoordinates(bodyPart, previousCoordinates);
    }

    snake.push(bodyPart);
  }

  function moveSnake() {
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
    moveInterval = setInterval(moveSnake, tick);
    startDrawingStars();
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

  function overlapsBody(gridPosition) {
    for(var i = 1; i < snake.length; i++) {
      cssCoordinates = gridToCSS(gridPosition);
      bodyPartCoordinates = getCSSCoordinates(snake[i]);
      if ( cssCoordinates.top + 'px' == bodyPartCoordinates.top
          && cssCoordinates.left + 'px' == bodyPartCoordinates.left) return true
    }
    return false
  }

  //-------------------------------------------------------
  //---------- menu on the left ---------------------------
  //-------------------------------------------------------
  function createLostMessage() {
    lostMessage = $('#lost')
    if (lostMessage.length == 0) {
      lostMessage = $('<div id="lost"></div>').prependTo($('#lost-container'));
    }
    lostMessage.text("Sorry, but you lost!");
  }

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
      e.preventDefault();
    }
    // start with arrows
    if ([37, 38, 39, 40].indexOf(e.which) !== -1
        && !isMoving
        && !lostAlready){
      startMoving();
    }
  }
  $(document).keydown(startAndStopSnake);

  function reinitialize(e) {
    if (lostAlready && e.which === 13)
      initialize();
  }
  $(document).keydown(reinitialize);

  function setSpeed(e) {
    if (e.which === 187) {
      tick /= 2;
    } else if (e.which === 189) {
      tick *= 2;
    }
    if ((e.which === 187
         || e.which === 189)
      && isMoving) {
      stopMoving();
      startMoving();
    }
  }
  $(document).keydown(setSpeed);

  $('#retry').click(initialize);

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
    setStarCoordinates(starContainer);
    star.active = true;

    starRemoveTimeout = setTimeout(removeStar, keepStarTick());
  }

  function setStarCoordinates(starContainer) {
    topValue = gridToCSS(star).top;
    leftValue = gridToCSS(star).left;
    setCSSCoordinates(starContainer, gridToCSS(star));
  }

  function drawStarTick() {
    return tick * (gridSize.x + gridSize.y);
  }

  function keepStarTick() {
    return drawStarTick() * 0.8;
  }

  function startDrawingStars() {
    starInterval = setInterval(drawStar, drawStarTick());
  }

  function stopDrawingStars() {
    clearInterval(starInterval);
    clearTimeout(starFirstTimeout);
  }

  function createStarContainer() {
    starContainer = $('<div id="star-container"><span id="star">*</span></div>').appendTo($('#container'));
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
});
