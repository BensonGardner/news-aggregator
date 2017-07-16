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
  var story;
  var storyStart = 0;
  var main = $('main');
  var inDetails = false;
  var storyLoadCount = 0;
  var storySection = document.createElement('section');
  var storyDetails;
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

  var loadStory = function() {
    console.log("loading man");
    console.log(storyLoadCount);

    if (storyLoadCount >= stories.length)
      return;
    APP.Data.getStoryById(stories[storyLoadCount], shoveStoryIn.bind(this, storyLoadCount));
  };

  function createStories(amount) {
    for (i = 0; i < amount; i++) {
      console.log("Creating stories, dude");
      requestAnimationFrame(function(){
        console.log("creating the loaders");
           // don't need this??
      //   details.time *= 1000;
        story = document.createElement('div');
        story.setAttribute('id', 's-' + storyLoadCount);
        story.classList.add('story');
        story.innerHTML = storyTemplate({
          title: '...',
          score: '-',
          by: '...',
          time: 0
        });
        requestAnimationFrame(loadStory.bind(this));
        storyLoadCount++;
      });
    }
    console.log("done with the loaders");
  }

  /**
   * As every single story arrives in shove its
   * content in at that exact moment. Feels like something
   * that should really be handled more delicately, and
   * probably in a requestAnimationFrame callback.
   */

  function shoveStoryIn (key, details) {
    console.log("shoving, dude");
    // OHHHHHH wat that hint means is we should wait until someone
    // clicks on a story to get all the stuff on the next page
    console.log(storyLoadCount);
    console.log(id + " is the id and the details is " + details);
    requestAnimationFrame(function(){
      var html = storyTemplate(details);
      story.innerHTML = html;
      story.addEventListener('click', onStoryClick.bind(this, details), true);
      main.appendChild(story);
    });
  }

  function onStoryClick(details) {

    storyDetails = $('sd-' + details.id);
    console.log(details.id);
    console.log('sd-' + details.id);
    console.log(storyDetails);

//changing details.id to storyDetails may be what broke the click fcn
    requestAnimationFrame(showStory.bind(this, details.id));

    // Create and append the story. A visual change...
    // perhaps that should be in a requestAnimationFrame?
    if (!storyDetails) {
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

      storyDetails = storySection;
      console.log(storyDetails);
      storyDetails.setAttribute('id', 'sd-' + details.id);
      console.log(storyDetails.id);
      storyDetails.classList.add('story-details');
      storyDetails.innerHTML = storyDetailsHtml;

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

  }

  function hideStory(id) {

    if (!inDetails)
      return;

    var storyDetails = $('#sd-' + id);
    var left = 0;

    document.body.classList.remove('details-active');
    storyDetails.style.opacity = 0;
    inDetails = false;
  }

  main.addEventListener('scroll', function() {

    // Adjust header style based on scroll direction
    if (main.scrollTop > lastScrollTop) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }

    if (Math.max(main.scrollTop, lastScrollTop) > ((stories.length + 100) / 90)) {
      createStories(200);
    }

    lastScrollTop = main.scrollTop;

  });



  // Bootstrap in the stories.
  APP.Data.getTopStories(function(data) {
    stories = data;
    createStories(15);
    main.classList.remove('loading');
  });

})();
