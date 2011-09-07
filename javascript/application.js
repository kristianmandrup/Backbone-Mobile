(function() {
  var EditVenueView, HomeRouter, HomeView, ShowVenueView, Venue, VenueCollection;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  window.app = {
    views: {},
    collections: {},
    routers: {},
    activePage: function() {
      return $(".ui-page-active");
    },
    reapplyStyles: function(el) {
      el.find('ul[data-role]').listview();
      el.find('div[data-role="fieldcontain"]').fieldcontain();
      el.find('div[data-role="collapsible"]').collapsible();
      el.find('button[data-role="button"]').button();
      el.find('input,textarea').textinput();
      return el.page();
    },
    goBack: function() {
      return $.historyBack();
    }
  };
  Venue = (function() {
    __extends(Venue, Backbone.Model);
    function Venue() {
      Venue.__super__.constructor.apply(this, arguments);
    }
    Venue.prototype.url = function() {
      return '/webapi/Foursquare/venues/#{id}';
    };
    Venue.prototype.getName = function() {
      return this.get('name');
    };
    Venue.prototype.getAddress = function() {
      return [this.get('location').address, this.get('location').city, this.get('location').state].join(", ");
    };
    Venue.prototype.getImageUrl = function() {
      return this.get('photo_url');
    };
    Venue.prototype.getLatitude = function() {
      return this.get('location').lat;
    };
    Venue.prototype.getLongitude = function() {
      return this.get('location').lng;
    };
    Venue.prototype.getMapUrl = function(width, height) {
      width || (width = 300);
      height || (height = 220);
      return "http://maps.google.com/maps/api/staticmap?center=" + (this.getLatitude()) + "," + (this.getLongitude()) + "&zoom=14&size=" + width + "x" + height + "&maptype=terrain&markers=color:red|" + (this.getLatitude()) + "," + (this.getLongitude()) + "&sensor=false";
    };
    return Venue;
  })();
  VenueCollection = (function() {
    __extends(VenueCollection, Backbone.Collection);
    function VenueCollection() {
      VenueCollection.__super__.constructor.apply(this, arguments);
    }
    VenueCollection.prototype.model = Venue;
    VenueCollection.prototype.url = '/webapi/Foursquare/venues/search?ll=34.02,-118.395';
    VenueCollection.prototype.parse = function(response) {
      var collectionArgs, venueData, venuesData, _fn, _i, _len;
      venuesData = response.response.venues;
      collectionArgs = [];
      _fn = function(venueData) {
        venueData.referenceURL = venueData.url;
        return collectionArgs.push(venueData);
      };
      for (_i = 0, _len = venuesData.length; _i < _len; _i++) {
        venueData = venuesData[_i];
        _fn(venueData);
      }
      console.log("parsed response: " + JSON.stringify(collectionArgs));
      return collectionArgs;
    };
    return VenueCollection;
  })();
  app.collections.venues = new VenueCollection;
  app.collections.venues.bind('change', function() {
    return console.log("VenueCollection with data has changed to " + JSON.stringify(this.pluck('id')));
  });
  EditVenueView = (function() {
    __extends(EditVenueView, Backbone.View);
    function EditVenueView() {
      this.render = __bind(this.render, this);      EditVenueView.__super__.constructor.apply(this, arguments);
      this.collection;
      this.el = app.activePage();
      this.template = _.template('  <div data-role="fieldcontain">\n    <label>Name</label>\n    <input type="text" value="<%= venue.getName() %>" name="name" />\n  </div>\n  \n  <div data-role="fieldcontain">\n    <label>Address</label>\n    <input type="text" value="<%= venue.get(\'location\').address %>" name="address" />\n  </div>\n \n  <div data-role="fieldcontain">\n    <label>City</label>\n    <input type="text" value="<%= venue.get(\'location\').city %>" name="city" />\n  </div>\n  \n  <div data-role="fieldcontain">\n    <label>State</label>\n    <input type="text" value="<%= venue.get(\'location\').state %>" name="state" />\n  </div>\n  \n  <button type="submit" data-role="button">Save</button>\n</form>');
      console.log("rendering view EditVenueView");
    }
    EditVenueView.prototype.events = {
      "submit form": "onSubmit"
    };
    EditVenueView.prototype.onSubmit = function(e) {
      this.model.set({
        name: this.$("input[name='name']").val(),
        address: this.$("input[name='address']").val(),
        city: this.$("input[name='city']").val(),
        state: this.$("input[name='state']").val()
      });
      this.model.trigger('change');
      app.goBack();
      e.preventDefault();
      return e.stopPropagation();
    };
    EditVenueView.prototype.render = function() {
      this.el.find('h1').text("Editing " + (this.model.getName()));
      this.el.find('.ui-content').html(this.template({
        venue: this.model
      }));
      app.reapplyStyles(this.el);
      return this.delegateEvents();
    };
    return EditVenueView;
  })();
  ShowVenueView = (function() {
    __extends(ShowVenueView, Backbone.View);
    function ShowVenueView() {
      this.render = __bind(this.render, this);      ShowVenueView.__super__.constructor.apply(this, arguments);
      console.log("initializing ShowVenue for venue id: " + this.model.id);
      this.el = app.activePage();
      this.template = _.template('     <div>\n       <h3><img src="<%= venue.get(\'categories\')[0].icon %>" /><%= venue.getName() %></h3>\n       <p>\n         <img style="width: 100%" src="<%= venue.getMapUrl() %>" />\n       </p>\n       \n       <address>\n         <%= venue.get(\'location\').address %><br>\n         <%= venue.get(\'location\').city %>, <%= venue.get(\'location\').state %> <%= venue.get(\'location\').postalCode %></a>\n       </address>\n    \n       <p><b>cross street:</b> <%= venue.get(\'location\').crossStreet %></p>\n       <p><b>latitude:</b> <%= venue.get(\'location\').lat %></p>\n       <p><b>longitude:</b> <%= venue.get(\'location\').lng %></p>\n       <p><b>distance:</b> <%= venue.get(\'location\').distance %></p> \n\n       <ul data-role="listview" data-inset="true">\n         <li data-role="list-divider">Actions</li>\n         <li><a rel="external" href="geo:<%= venue.get(\'location\').lat %>,<%= venue.get(\'location\').lng %>?z=8">Open Map</a></li> \n         <li><a href="#venues-<%= venue.id %>-edit">Edit</a></li>\n       </ul>\n     </div>');
      this.model.bind('change', this.render);
      console.log("rendering view ShowVenueView");
      this.render();
    }
    ShowVenueView.prototype.render = function() {
      this.el.find('h1').text(this.model.getName());
      this.el.find('.ui-content').html(this.template({
        venue: this.model
      }));
      return app.reapplyStyles(this.el);
    };
    return ShowVenueView;
  })();
  HomeView = (function() {
    __extends(HomeView, Backbone.View);
    function HomeView() {
      this.render = __bind(this.render, this);      HomeView.__super__.constructor.apply(this, arguments);
    }
    HomeView.prototype.initialize = function() {
      var venueLinks;
      venueLinks = this.venues.map(function(v) {
        return v.url();
      });
      console.log("initializing HomeView with urls: " + JSON.stringify(venueLinks));
      this.el = app.activePage();
      return this.template = _.template('<div data-role="collapsible-set">\n  <% venues.each(function(venue){ %>\n  <div data-role="collapsible" data-collapsed="false">\n    <h3><img src="<%= venue.get(\'categories\')[0].icon %>" /><%= venue.getName() %></h3>\n    <p><b>category:</b> <%= venue.get(\'categories\')[0].name %></p>\n    <p><b>phone:</b> <a href="tel:<%= venue.get(\'contact\').phone  %>"><%= venue.get(\'contact\').formattedPhone %></a></p>\n    <p><b>address:</b> <a href="#venues-<%= venue.id %>"><%= venue.get(\'location\').address %>, <%= venue.get(\'location\').city %></a>\n    <p><b>checkins:</b> <%= venue.get("stats").checkinsCount %></p>\n    <p><b>user count:</b> <%= venue.get("stats").usersCount %></p>\n    <p><b>tip count:</b> <%= venue.get("stats").tipCount %></p>\n    <ul data-role="listview" data-inset="true">\n      <li data-role="list-divider">Actions</li>\n      <li><a href="#venues-<%= venue.id %>">Show Location Info</a></li>\n      <li><a href="#venues-<%= venue.id %>-edit">Edit</a></li>\n    </ul>\n  </div>\n  <% }); %>\n</div>');
    };
    HomeView.prototype.venues = app.collections.venues;
    HomeView.prototype.render = function() {
      if (app.collections.venues.models.length > 0) {
        console.log("processing template");
        this.el.find('.ui-content').html(this.template({
          venues: this.venues
        }));
      } else {
        console.log("no venues... just giving simple html");
        this.el.find('.ui-content').html("Can't find any venues!");
      }
      return app.reapplyStyles(this.el);
    };
    return HomeView;
  })();
  HomeRouter = (function() {
    __extends(HomeRouter, Backbone.Router);
    HomeRouter.prototype.routes = {
      "venues-:id-edit": "edit",
      "venues-:id": "show",
      "": "home"
    };
    function HomeRouter() {
      HomeRouter.__super__.constructor.apply(this, arguments);
    }
    HomeRouter.prototype.home = function() {
      console.log("fetching VenueCollection information for the home view!");
      app.collections.venues.fetch({
        success: function(collection, response) {
          var _base;
          console.log("fetched venues");
          (_base = app.views).home || (_base.home = new HomeView);
          return app.views.home.render();
        },
        error: function(model, response) {
          return console.log("failure fetching venues -- model " + JSON.stringify(model) + "response: " + JSON.stringify(response));
        }
      });
      return console.log("setting up views");
    };
    HomeRouter.prototype.show = function(id) {
      console.log("setting up view: venues-" + id);
      return app.collections.venues.fetch({
        success: function(collection, response) {
          var _base, _name;
          console.log("fetched venues");
          (_base = app.views)[_name = "venues-" + id] || (_base[_name] = new ShowVenueView({
            model: app.collections.venues.get(id)
          }));
          return app.views["venues-" + id].render();
        },
        error: function(model, response) {
          return console.log("failure fetching venues -- model " + JSON.stringify(model) + "response: " + JSON.stringify(response));
        }
      });
    };
    HomeRouter.prototype.edit = function(id) {
      console.log("setting up view: venues-" + id + "-edit");
      return app.collections.venues.fetch({
        success: function(collection, response) {
          var _base, _name;
          console.log("fetched venues");
          (_base = app.views)[_name = "venues-" + id + "-edit"] || (_base[_name] = new EditVenueView({
            model: app.collections.venues.get(id)
          }));
          return app.views["venues-" + id + "-edit"].render();
        },
        error: function(model, response) {
          return console.log("failure fetching venues -- model " + JSON.stringify(model) + "response: " + JSON.stringify(response));
        }
      });
    };
    return HomeRouter;
  })();
  app.homeRouter = new HomeRouter();
  $(document).ready(function() {
    return Backbone.history.start();
  });
}).call(this);
