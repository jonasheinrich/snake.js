$(function() {
  //TODO get clear about the usage of snake[0] or $('#body-0')
  //TODO high-score
  //input for gridSize, blockSize, tick etc?
  //attributes
  var snake;
  var positionHead = {};
  var direction = {};
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
  //durations, e.g. move the snake every tick ms
  var tick;
  var drawStarEvery;
  var keepStarFor;

  //settings
  //TODO max-gridSize?
  var gridSize = {
    x: 12,
    y: 10
  };
  var blockSize = 60;

  //start variables
  var initialSnakeLength = 3;
  var initialPositionHead = {
    x: 6,
    y: 5
  }
  var initialDirection = {
    x: 0,
    y: 0
  };
  var initialTick = 250;
  var initialDrawStarEvery = 6000;
  //keepStar equals drawStarEvery * 0.8

  //setting up the game
  function initialize() {
    lostAlready = false;
    firstStar = true;
    snake = [];
    tick = initialTick;
    drawStarEvery = initialDrawStarEvery;
    keepStarFor = drawStarEvery * 0.8;

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
    clearLostMessage();
    container.html('');
    for(var i = 0; i < initialSnakeLength; i++) {
      addBodyPart();
    }
  }
  createLostMessage();
  initialize();

  function addBodyPart() {
    var i = snake.length;
    bodyPart = $('<div id="body-' + i + '" class="body-part"></div>').appendTo(container);
    bodyPart.css({
      width: blockSize,
      height: blockSize
    })
    bodyPart.css({position: 'absolute'})

    if(i === 0) {
      bodyPart.css(gridToCSS(positionHead));
    } else {
      //take the coordinates from the previous element
      topValue = snake[i - 1].css('top');
      leftValue = snake[i - 1].css('left');
      bodyPart.css({
        top: topValue,
        left: leftValue
      });
    }

    snake.push(bodyPart);
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

  function moveSnake() {
    positionHead.x += direction.x;
    positionHead.y += direction.y;

    if(hitWall() || hitItself()) {
      stopMoving();
      lostAlready = true;
      reddenHead();
      writeLostMessage();
      return
    }

    if (hitStar()) eatStar();

    //TODO duplicated code (see addBodyPart)
    //TODO don't use overkill object here, just topValuePrevious
    topValue = snake[0].css('top');
    leftValue = snake[0].css('left');
    previousElementBeforeMove = {
      top: topValue,
      left: leftValue
    };

    moveHead();

    for(var i = 1; i < snake.length; i++) {
      topValue = snake[i].css('top');
      leftValue = snake[i].css('left');
      if (previousElementBeforeMove.top === topValue && previousElementBeforeMove.left === leftValue ) continue;
      topValue = previousElementBeforeMove.top;
      leftValue = previousElementBeforeMove.left;
      //TODO code dupliation
      previousElementBeforeMove.top = snake[i].css('top');
      previousElementBeforeMove.left = snake[i].css('left');
      snake[i].css({
        top: topValue,
        left: leftValue
      });
    }
    steeredAlready = false;
  }

  function reddenHead() {
    $('#body-0').css('background-color', 'BD5555');
  }

  $('#retry').click(initialize);

  function createLostMessage() {
    lostMessage = $('#lost')
    if (lostMessage.length == 0) {
      lostMessage = $('<div id="lost"></div>').prependTo($('#lost-container'));
    }
    lostMessage.text("Sorry, but you lost!");
  }

  function writeLostMessage() {
    $('#lost').css({visibility: 'visible'});
  }

  function clearLostMessage() {
    $('#lost').css({visibility: 'hidden'});
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

  function overlapsBody(gridPosition) {
    for(var i = 1; i < snake.length; i++) {
      //TODO code duplication?
      calculatedGridPosition = gridToCSS(gridPosition);
      if ( calculatedGridPosition.top + 'px' == snake[i].css('top')
          && calculatedGridPosition.left + 'px' == snake[i].css('left')) return true
    }
    return false
  }

  function moveHead() {
    $('#body-0').css(gridToCSS(positionHead));
  }

  function steerSnake(e) {
    if (lostAlready) return
    if (steeredAlready) {
      blinkHead();
      return;
    }
    //TODO the repeated assignment of steeredAlready is annoying
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

  function blinkHead() {
    snake[0].css('background-color', 'DDD')
    setTimeout(function() {snake[0].css('background-color', '')}, 150);
  }

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
      //TODO stop default event
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

  //TODO button for setting speed?
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

  var star = {
    active: false
  }

  function drawStar() {
    clearTimeout(starRemoveTimeout);
    //TODO seems like sometimes the star gets drawn on the snake body..
    //maybe because the star is drawn in between the drawing of
    //two body parts?
    do {
      star.x = Math.floor(Math.random() * (gridSize.x -1));
      star.y = Math.floor(Math.random() * (gridSize.y - 1));
    }
    while (overlapsBody(star))

    starContainer = $('#star-container');
    if (starContainer.length === 0) starContainer = createStarContainer();
    starContainer.css('visibility', 'visible');
    setStarCoordinates(starContainer);
    star.active = true;

    starRemoveTimeout = setTimeout(removeStar, keepStarFor);
  }

  function setStarCoordinates(starContainer) {
    topValue = gridToCSS(star).top;
    leftValue = gridToCSS(star).left;
    starContainer.css({
      top: topValue,
      left: leftValue
    });
  }

  function startDrawingStars() {
    starInterval = setInterval(drawStar, drawStarEvery);
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
});
