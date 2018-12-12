import './assets/scss/app.scss';
import $ from 'cash-dom';


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

    $('.load-username').on('click', function (e) {
      let userName = $('.username.input').val();

      fetch('https://api.github.com/users/' + userName)
        .then((response) => { response.json })
        .then(function (body) {
          self.profile = body;
          self.update_profile();
        })

    })

  }

  update_profile() {
    $('#profile-name').text($('.username.input').val())
    $('#profile-image').attr('src', this.profile.avatar_url)
    $('#profile-url').attr('href', this.profile.html_url).text(this.profile.login)
    $('#profile-bio').text(this.profile.bio || '(no information)')
  }
}
