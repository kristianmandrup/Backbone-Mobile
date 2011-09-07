#
# Some helper methods
#

window.app = {
  views: {}
  collections: {}
  routers: {}
  
  activePage: ->
    $(".ui-page-active")
    
  reapplyStyles: (el) ->
    el.find('ul[data-role]').listview();
    el.find('div[data-role="fieldcontain"]').fieldcontain();
    el.find('div[data-role="collapsible"]').collapsible();
    el.find('button[data-role="button"]').button();
    el.find('input,textarea').textinput();
    el.page()
    
  goBack: ->
    $.historyBack()
}

#
# Venue class
#

class Venue extends Backbone.Model
  url : ->
    return '/webapi/Foursquare/venues/#{id}'

  getName: ->
    @get('name')
    
  getAddress: ->
    [@get('location').address, @get('location').city, @get('location').state].join ", "
    
  getImageUrl: ->
    @get('photo_url')
    
  getLatitude: ->
    @get('location').lat

  getLongitude: ->
    @get('location').lng

  getMapUrl: (width, height) ->
    width ||= 300
    height ||= 220
    
    "http://maps.google.com/maps/api/staticmap?center=#{@getLatitude()},#{@getLongitude()}&zoom=14&size=#{width}x#{height}&maptype=terrain&markers=color:red|#{@getLatitude()},#{@getLongitude()}&sensor=false"

#
# Venue Collection
#

class VenueCollection extends Backbone.Collection
  model: Venue
  
  #TODO: this needs to use coordinates from app 
  #34.021N. The longitude is -118.395W 
  url: '/webapi/Foursquare/venues/search?ll=34.02,-118.395'

  parse: (response) ->
    venuesData = response.response.venues

    collectionArgs = [] 

    for venueData in venuesData
      do (venueData) ->
        venueData.referenceURL = venueData.url
        collectionArgs.push(venueData)
 
    console.log "parsed response: " + JSON.stringify(collectionArgs); 

    return collectionArgs    

app.collections.venues = new VenueCollection
app.collections.venues.bind 'change', ->
  console.log ("VenueCollection with data has changed to " + JSON.stringify(@pluck('id')))

#
# Edit Venue View
#

class EditVenueView extends Backbone.View
  constructor: ->
    super
    @collection 
    
    # Get the active page from jquery mobile. We need to keep track of what this
    # dom element is so that we can refresh the page when the page is no longer active.
    @el = app.activePage()
   
    @template = _.template('''
      <div data-role="fieldcontain">
        <label>Name</label>
        <input type="text" value="<%= venue.getName() %>" name="name" />
      </div>
      
      <div data-role="fieldcontain">
        <label>Address</label>
        <input type="text" value="<%= venue.get('location').address %>" name="address" />
      </div>
     
      <div data-role="fieldcontain">
        <label>City</label>
        <input type="text" value="<%= venue.get('location').city %>" name="city" />
      </div>
      
      <div data-role="fieldcontain">
        <label>State</label>
        <input type="text" value="<%= venue.get('location').state %>" name="state" />
      </div>
      
      <button type="submit" data-role="button">Save</button>
    </form>
    ''')
    
    console.log "rendering view EditVenueView"; 
   
  events : {
    "submit form" : "onSubmit"
  }

  onSubmit: (e) ->
    @model.set {
      name : @$("input[name='name']").val(),
      address : @$("input[name='address']").val(),
      city : @$("input[name='city']").val(),
      state : @$("input[name='state']").val()
    }
    
    @model.trigger('change')

    app.goBack()
    
    e.preventDefault()
    e.stopPropagation()

  render: =>
    # Set the name of the page
    @el.find('h1').text("Editing #{@model.getName()}")
    
    # Render the content
    @el.find('.ui-content').html(@template({venue : @model}))

    # A hacky way of reapplying the jquery mobile styles
    app.reapplyStyles(@el)

    # Delegate from the events hash
    @delegateEvents()

#
# Show Venue View
#

class ShowVenueView extends Backbone.View
  constructor: ->
    super

    console.log "initializing ShowVenue for venue id: #{@model.id}" 
    
    # Get the active page from jquery mobile. We need to keep track of what this
    # dom element is so that we can refresh the page when the page is no longer active.
    @el = app.activePage()

    @template = _.template('''
      <div>
        <h3><img src="<%= venue.get('categories')[0].icon %>" /><%= venue.getName() %></h3>
        <p>
          <img style="width: 100%" src="<%= venue.getMapUrl() %>" />
        </p>
        
        <address>
          <%= venue.get('location').address %><br>
          <%= venue.get('location').city %>, <%= venue.get('location').state %> <%= venue.get('location').postalCode %></a>
        </address>
     
        <p><b>cross street:</b> <%= venue.get('location').crossStreet %></p>
        <p><b>latitude:</b> <%= venue.get('location').lat %></p>
        <p><b>longitude:</b> <%= venue.get('location').lng %></p>
        <p><b>distance:</b> <%= venue.get('location').distance %></p> 
 
        <ul data-role="listview" data-inset="true">
          <li data-role="list-divider">Actions</li>
          <li><a rel="external" href="geo:<%= venue.get('location').lat %>,<%= venue.get('location').lng %>?z=8">Open Map</a></li> 
          <li><a href="#venues-<%= venue.id %>-edit">Edit</a></li>
        </ul>
      </div>
    ''')
    
    # Watch for changes to the model and redraw the view
    @model.bind 'change', @render
    
    console.log "rendering view ShowVenueView"; 
    
    # Draw the view
    @render()
    
  render: =>
    # Set the name of the page
    @el.find('h1').text(@model.getName())
    
    # Render the content
    @el.find('.ui-content').html(@template({venue : @model}))

    # A hacky way of reapplying the jquery mobile styles
    #TODO: does a not hacky way exist to do this?
    app.reapplyStyles(@el)
  
#
# Home View
#
  
class HomeView extends Backbone.View
  constructor: ->
    super
   
  initialize: -> 
    venueLinks =  @venues.map (v) -> 
      v.url()
 
    console.log "initializing HomeView with urls: " + JSON.stringify(venueLinks) 
    
    @el = app.activePage()

    @template = _.template('''
      <div data-role="collapsible-set">
        <% venues.each(function(venue){ %>
        <div data-role="collapsible" data-collapsed="false">
          <h3><img src="<%= venue.get('categories')[0].icon %>" /><%= venue.getName() %></h3>
          <p><b>category:</b> <%= venue.get('categories')[0].name %></p>
          <p><b>phone:</b> <a href="tel:<%= venue.get('contact').phone  %>"><%= venue.get('contact').formattedPhone %></a></p>
          <p><b>address:</b> <a href="#venues-<%= venue.id %>"><%= venue.get('location').address %>, <%= venue.get('location').city %></a>
          <p><b>checkins:</b> <%= venue.get("stats").checkinsCount %></p>
          <p><b>user count:</b> <%= venue.get("stats").usersCount %></p>
          <p><b>tip count:</b> <%= venue.get("stats").tipCount %></p>
          <ul data-role="listview" data-inset="true">
            <li data-role="list-divider">Actions</li>
            <li><a href="#venues-<%= venue.id %>">Show Location Info</a></li>
            <li><a href="#venues-<%= venue.id %>-edit">Edit</a></li>
          </ul>
        </div>
        <% }); %>
      </div>
    ''')

    #@venues.bind 'change', @render

  venues: app.collections.venues;
  
  render: =>
    
    if app.collections.venues.models.length > 0   
      console.log "processing template"

      @el.find('.ui-content').html(@template({venues : @venues}))
    else 
      console.log "no venues... just giving simple html"
      @el.find('.ui-content').html("Can't find any venues!")
    
    # A hacky way of reapplying the jquery mobile styles
    #TODO: does a not hacky way exist to do this?
    app.reapplyStyles(@el)  

#
# Our only router
#

#TODO: use the naming convention mentioned in http://www.jamesyu.org/2011/02/09/backbone.js-tutorial-with-rails-part-2/
class HomeRouter extends Backbone.Router
  routes:
    "venues-:id-edit" : "edit"
    "venues-:id" : "show"
    ""  : "home"

  constructor: ->
    super

  home : ->
    console.log("fetching VenueCollection information for the home view!");

    app.collections.venues.fetch   
      success: (collection, response) -> 
        console.log "fetched venues" #-- model " + JSON.stringify(model) + "response: " + JSON.stringify(response)
        app.views.home ||= new HomeView
        app.views.home.render()
      
      error: (model, response) ->  
        console.log "failure fetching venues -- model " + JSON.stringify(model) + "response: " + JSON.stringify(response)

    console.log "setting up views"

  show: (id) ->
    #TODO: should i refresh just this value at this point?
    console.log("setting up view: venues-" + id)

    app.collections.venues.fetch   
      success: (collection, response) -> 
        console.log "fetched venues" #-- model " + JSON.stringify(model) + "response: " + JSON.stringify(response)
        app.views["venues-#{id}"] ||= new ShowVenueView { model : app.collections.venues.get(id) }
        app.views["venues-#{id}"].render()

      error: (model, response) ->  
        console.log "failure fetching venues -- model " + JSON.stringify(model) + "response: " + JSON.stringify(response)

  edit: (id) ->
    console.log("setting up view: venues-#{id}-edit")
    
    app.collections.venues.fetch   
      success: (collection, response) -> 
        console.log "fetched venues" #-- model " + JSON.stringify(model) + "response: " + JSON.stringify(response)
        app.views["venues-#{id}-edit"] ||= new EditVenueView { model : app.collections.venues.get(id) }
        app.views["venues-#{id}-edit"].render()

      error: (model, response) ->  
        console.log "failure fetching venues -- model " + JSON.stringify(model) + "response: " + JSON.stringify(response)

app.homeRouter = new HomeRouter()

#
# Start the app
#  

$(document).ready ->
  Backbone.history.start()
