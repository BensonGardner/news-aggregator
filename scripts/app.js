/**
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
APP.Main = (function() {

  var LAZY_LOAD_THRESHOLD = 300;
  var $ = document.querySelector.bind(document);

  var stories = null;
  var storyStart = 0;
  var main = $('main');
  var inDetails = false;
  var storyLoadCount = 0;
  var lastScrollTop;
  var localeData = {
    data: {
      intl: {
        locales: 'en-US'
      }
    }
  };

  var tmplStory = $('#tmpl-story').textContent;
  var tmplStoryDetails = $('#tmpl-story-details').textContent;
  var tmplStoryDetailsComment = $('#tmpl-story-details-comment').textContent;

  if (typeof HandlebarsIntl !== 'undefined') {
    HandlebarsIntl.registerWith(Handlebars);
  } else {

    // Remove references to formatRelative, because Intl isn't supported.
    var intlRelative = /, {{ formatRelative time }}/;
    tmplStory = tmplStory.replace(intlRelative, '');
    tmplStoryDetails = tmplStoryDetails.replace(intlRelative, '');
    tmplStoryDetailsComment = tmplStoryDetailsComment.replace(intlRelative, '');
  }

  var storyTemplate =
      Handlebars.compile(tmplStory);
  var storyDetailsTemplate =
      Handlebars.compile(tmplStoryDetails);
  var storyDetailsCommentTemplate =
      Handlebars.compile(tmplStoryDetailsComment);

  /**
   * As every single story arrives in shove its
   * content in at that exact moment. Feels like something
   * that should really be handled more delicately, and
   * probably in a requestAnimationFrame callback.
   */
  function onStoryData (key, details) {

    // I'm not sure how it's getting the details variable.
    // it seems only to be passing the "this" value (thru the bind() operation)
    // and the key. and yet when i do console.log , we do have a value
    // for both arguments. not sure why.

    // This seems odd. Surely we could just select the story
    // directly rather than looping through all of them.
    // OHHHHHH wat that hint means is we should wait until someone
    // clicks on a story to get all the stuff on the next page

    details.time *= 1000;
    var story = document.getElementById('s-' + key);
    var html = storyTemplate(details);
    story.innerHTML = html;
    story.addEventListener('click', onStoryClick.bind(this, details), true);
   // story.classList.add('clickable');

    // Tick down. When zero we can batch in the next load.
    storyLoadCount++;
  }

  function onStoryClick(details) {
    console.log('ya clicked me! congrats!');

    var storyDetails = $('sd-' + details.id);
    console.log(details.id);
    console.log('sd-' + details.id);
    console.log(storyDetails);

    requestAnimationFrame(showStory.bind(this, details.id));

    // Create and append the story. A visual change...
    // perhaps that should be in a requestAnimationFrame?
    // And maybe, since they're all the same, I don't
    // need to make a new element every single time? I mean,
    // it inflates the DOM and I can only see one at once.
    if (!storyDetails) {
      console.log(storyDetails + ' should be !');
      console.log(details.url);
      if (details.url)
        details.urlobj = new URL(details.url);

      var comment;
      var commentsElement;
      var storyHeader;
      var storyContent;

      var storyDetailsHtml = storyDetailsTemplate(details);
      var kids = details.kids;
      var commentHtml = storyDetailsCommentTemplate({
        by: '', text: 'Loading comment...'
      });

      storyDetails = document.createElement('section');
      console.log(storyDetails);
      storyDetails.setAttribute('id', 'sd-' + details.id);
      console.log(storyDetails.id);
      storyDetails.classList.add('story-details');
      storyDetails.innerHTML = storyDetailsHtml;
      console.log(storyDetails.innerHTML);

      document.body.appendChild(storyDetails);

      commentsElement = storyDetails.querySelector('.js-comments');
      storyHeader = storyDetails.querySelector('.js-header');
      storyContent = storyDetails.querySelector('.js-content');

      var closeButton = storyDetails.querySelector('.js-close');
      closeButton.addEventListener('click', hideStory.bind(this, details.id));

      var headerHeight = storyHeader.getBoundingClientRect().height;
      storyContent.style.paddingTop = headerHeight + 'px';

      if (typeof kids === 'undefined')
        return;

      for (var k = 0; k < kids.length; k++) {

        comment = document.createElement('aside');
        comment.setAttribute('id', 'sdc-' + kids[k]);
        comment.classList.add('story-details__comment');
        comment.innerHTML = commentHtml;
        commentsElement.appendChild(comment);

        // Update the comment with the live data.
        APP.Data.getStoryComment(kids[k], function(commentDetails) {

          commentDetails.time *= 1000;

          var comment = commentsElement.querySelector(
              '#sdc-' + commentDetails.id);
          comment.innerHTML = storyDetailsCommentTemplate(
              commentDetails,
              localeData);
          console.log(storyDetails + ' first');
        });
        console.log(storyDetails + ' second');
      }
      console.log(storyDetails + ' third');
    }
    console.log(storyDetails + ' fourth');
  }

  function showStory(id) {

    if (inDetails)
      return;

    inDetails = true;

    var storyDetails = $('#sd-' + id);
    var left = null;

    if (!storyDetails)
      return;

    document.body.classList.add('details-active');
    storyDetails.style.opacity = 1;

    function animate () {

      // Find out where it currently is.
      var mainPosition = main.getBoundingClientRect();
      // well, i tnink this is forcing layout....
      var storyDetailsPosition = storyDetails.getBoundingClientRect();
      var target = mainPosition.width + 100;

      // Set the left value if we don't have one already.
      if (left === null)
        left = storyDetailsPosition.left;

      // Now figure out where it needs to go.
      left += (0 - storyDetailsPosition.left) * 0.1;

      // Set up the next bit of the animation if there is more to do.
      if (Math.abs(left) > 0.5)
        requestAnimationFrame(animate);
      else
        left = 0;

      // And update the styles. Wait, is this a read-write cycle?
      // I hope I don't trigger a forced synchronous layout!
      // yup you are becuase we first read the layout values, then set the left value
      // based on that, whihh will then erquire re-calculating of styles,
      // which then reuiers more layout
      storyDetails.style.left = left + 'px';
    }

    requestAnimationFrame(animate);
  }

  function hideStory(id) {

    if (!inDetails)
      return;

    var storyDetails = $('#sd-' + id);
    var left = 0;

    document.body.classList.remove('details-active');
    storyDetails.style.opacity = 0;

    requestAnimationFrame(animate);
  }

  main.addEventListener('scroll', function() {


    // Adjust header style based on scroll direction
    if (main.scrollTop > lastScrollTop) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }

    lastScrollTop = main.scrollTop;

    if (main.scrollTop > (storyLoadCount - 40) * 90) {
      loadStoryBatch();
    }
  });

  function loadStoryBatch() {

    if (storyLoadCount % 100 != 0)
      return;

    // storyStart is being used to set the i, which is in turn used
    // to grab the right story from the data source.

    // storyLoadCount is set to 100 when we load a new batch like this,
    // then ticked down in that loop elsewhere in the app.js. However,
    // it's possible that we don't need to tick them like that, which
    // would mean we could get rid of the storyLoadCount var. We might
    // be able to just grab the stories from the data based on an index
    // that is set more simply.

    for (var i = 0; i < 100; i++) {

      if (i >= stories.length)
        return;

      var key = String(stories[i]);
      var story = document.createElement('div');
      story.setAttribute('id', 's-' + key);
      story.classList.add('story');
      story.innerHTML = storyTemplate({
        title: '...',
        score: '-',
        by: '...',
        time: 0
      });
      main.appendChild(story);

      APP.Data.getStoryById(stories[i], onStoryData.bind(this, key));
    }

  }

  // Bootstrap in the stories.
  APP.Data.getTopStories(function(data) {
    stories = data;
    loadStoryBatch();
    main.classList.remove('loading');
  });

})();
