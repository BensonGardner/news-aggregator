  function loadStory() {

      console.log(storyLoadCount);

      if (storyLoadCount >= stories.length)
        return;

      APP.Data.getStoryById(stories[storyLoadCount], shoveStoryIn.bind(this, key));
  }