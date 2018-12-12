import './assets/scss/app.scss';
import $ from 'cash-dom';
import axios from 'axios';

require('es6-promise').polyfill();

export class App {
  initializeApp() {
    let self = this;

    //validation
    const formPattern = new RegExp("^[a-z0-9_-]*$", "i");

    $('.username').on('keyup', function (e) {
      let userName = $('.username.input').val();
      if (!(formPattern.test(userName)) || (userName.length == 0)) {
        $('.username').addClass('invalid');
        $('.load-username').prop('disabled', true);
      } else {
        $('.username').removeClass('invalid');
        $('.load-username').prop('disabled', false);
      }
    })

    //fetching data
    $('.load-username').on('click', function (e) {
      let userName = $('.username.input').val();
      axios.get(`https://api.github.com/users/${userName}`)
        .then((response) => {
          $('.loader').removeClass("is-hidden");
          self.profile = response.data;
          self.updateProfile();
          return axios.get(`https://api.github.com/users/${userName}/events/public?&per_page=100`);
        })
        .then((response) => {
          self.requestsInfo = response.data;
          self.updateRequestsInfo();
        })
        .catch((error) => {
          console.log("Coś poszło nie tak", error);
          $('.loader').addClass("is-hidden");
        })

    })

  }

  updateProfile() {
    let profile = document.getElementById("profile-info");
    let profileTemplateString = `
    <h2 class="subtitle is-4 ">Profile</h2>
    <div class="profile ">
      <div class="media">
        <div class="media-left">
          <figure class="media-left image is-64x64">
            <img src="${this.profile.avatar_url}" id="profile-image">
          </figure>
        </div>
        <div class="media-content">
          <p class="title is-5" id="profile-name">${this.profile.login}</p>
          <p class="subtitle is-6"><a href="${this.profile.html_url}" id="profile-url">@${this.profile.login}</a></p>
        </div>
      </div>
      <div class="content" id="profile-bio">
        <p>${this.profile.bio || '(no information)'}</p>
      </div>
    </div>`
    //injecting profile to the dom
    profile.innerHTML = profileTemplateString;
  }
  updateRequestsInfo() {
    let timeline = document.getElementById("user-timeline");
    let timelineFeed = '<h2 class="subtitle is-4">History</h2>';
    const datePattern = /^[^T]*/;
    let requestsArray = this.requestsInfo;
    let sortedArray = $(requestsArray).filter(function (i, n) { return n.type === 'PullRequestEvent' || n.type === 'PullRequestReviewCommentEvent' });

    //ie polyfill for object.entries
    if (!Object.entries) {
      Object.entries = function (obj) {
        var ownProps = Object.keys(obj),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array
        while (i--)
          resArray[i] = [ownProps[i], obj[ownProps[i]]];

        return resArray;
      };
    }

    //mapping object to array
    const result = Object.entries(sortedArray).map(([key, value]) => ({ [key]: value }));
    result.pop();

    //generating timeline feed
    result.forEach((element, i) => {
      let date = element[i].created_at.match(datePattern).toString();
      let templateString = "";
      // i have decided to use switch case instead of just variables, because task.md says: "please take into account that other events will be implemented later."
      // it can get messy if there would 5 different event types. Code would be illegible.
      // My solution is longer but clearer
      switch (element[i].type) {
        case "PullRequestEvent":
          templateString = `
            <div class="timeline-item">
            <div class="timeline-marker "></div>
            <div class="timeline-content">
              <p class="heading">${date}</p>
              <div class="content">
                  <div class="avatar">
                      <img src="${element[i].actor.avatar_url}" />
                    </div>
                    <div class="description">
                      <a href="${element[i].payload.pull_request.user.html_url}">${element[i].actor.login}</a> ${element[i].payload.action}
                      <a href="${element[i].payload.pull_request.html_url}">pull request</a>
                      <p class="repo-name">
                        <a href="https://github.com/${element[i].repo.name}">${element[i].repo.name}</a>
                      </p>
                    </div>
              </div>
            </div>
          </div>`;
          timelineFeed += templateString;
          break;
        case "PullRequestReviewCommentEvent":
          templateString = `
            <div class="timeline-item">
            <div class="timeline-marker "></div>
            <div class="timeline-content">
              <p class="heading">${date}</p>
              <div class="content">
                  <div class="avatar">
                      <img src="${element[i].payload.comment.user.avatar_url}" />
                    </div>
                    <div class="description">
                      <a href="${element[i].payload.comment.user.html_url}">${element[i].payload.comment.user.login}</a> ${element[i].payload.action}
                      <a href="${element[i].payload.comment.html_url}">comment</a> to <a href="${element[i].payload.pull_request.html_url}">pull Request</a>
                      <p class="repo-name">
                        <a href="https://github.com/${element[i].repo.name}">${element[i].repo.name}</a>
                      </p>
                    </div>
              </div>
            </div>
          </div>`;
          timelineFeed += templateString;
          break;
      }
    });
    //injecting timeline to the dom
    timeline.innerHTML = timelineFeed;
    $('.loader').addClass("is-hidden");
  }
}
