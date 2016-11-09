
var flickrwa = (function() {
  var FLICKR_KEY = 'FillInLater';
  var FLICKR_API_URL_QUERY = 'api_key=' + FLICKR_KEY;
  var FLICKR_FORMAT_URL_QUERY = 'format=json&nojsoncallback=1';
  
  var FLICKR_NUM_PHOTOS_RETRIEVED = 240;
  var FLICKR_NUM_PHOTO_PAGES_RETRIEVED = 1;
  
  var _anchorMap = {};
  var _photoId;
  
  var FocusPhotoExit = React.createClass({
    onPhotoExitClicked: function() {
      var anchorMap = {};
      
      // Begin attempt to update URI: revert if not successful
      try {
        $.uriAnchor.setAnchor(anchorMap);
      } catch ( error ) {
        // replace URI with existing state
        anchorMap = _anchorMap;
        $.uriAnchor.setAnchor(anchorMap, null, true );
      }
      
      _anchorMap = anchorMap;
    },
    
    render: function() {
      return (
        <div className="FocusPhotoExit" onClick={this.onPhotoExitClicked}>
          <button>X</button>
        </div>
      );
    }
  });
  
  var FocusPhoto = React.createClass({
    getInitialState: function() {
      return {photoInfo: []};
    },

    resetToGallery: function() {
      var anchorMap = {};
      
      // Begin attempt to update URI: revert if not successful
      try {
        $.uriAnchor.setAnchor(anchorMap);
      } catch ( error ) {
        // replace URI with existing state
        anchorMap = _anchorMap;
        $.uriAnchor.setAnchor(anchorMap, null, true );
      }
      
      _anchorMap = anchorMap;
    },
    
    loadPhotoFromServer: function() {
      // TODO: Couple probably reuse data from earlier call
      $.ajax({
        url: this.props.url + '?method=flickr.photos.getSizes' + '&photo_id=' + this.props.id + '&' + FLICKR_FORMAT_URL_QUERY + '&' + FLICKR_API_URL_QUERY,
        cache: false,
        success: function(data) {
          if (data.stat === 'ok') {
            this.setState({photoInfo: data.sizes});
          } else if (data.stat === 'fail') {
            // TODO: Should add an error message in the future but go back to the gallery for now
            this.resetToGallery();
          }
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
          // TODO: Should add an error message in the future but go back to the gallery for now
          this.resetToGallery();
        }.bind(this)
      });
    },
    
    componentDidMount: function() {
      if (this.props.id) {
        this.loadPhotoFromServer();
      }
    },
    
    render: function() {
      var url = '', urlLarge = '', urlLargeSquare = '';
      
      if ((this.state.photoInfo) && (this.state.photoInfo.size)) {
        this.state.photoInfo.size.forEach(function(size, index, array) {
          if (size.label === "Original") {
            url = size.source;
          } else if (size.label === "Large") {
            urlLarge = size.source;
          } else if (size.label === "Large Square") {
            urlLargeSquare = size.source;
          }
        });
        
        if (url === '') {
          url = urlLarge;
        }
        if (url === '') {
          url = urlLargeSquare;
        }
      }
      return (
        <div className="FocusPhoto">
          <img src={url} />
        </div>
      );
    }
  });
  
  var Photo = React.createClass({
    getInitialState: function() {
      return {photoInfo: []};
    },

    loadPhotoFromServer: function() {
      $.ajax({
        url: this.props.url + '?method=flickr.photos.getSizes' + '&photo_id=' + this.props.id + '&' + FLICKR_FORMAT_URL_QUERY + '&' + FLICKR_API_URL_QUERY,
        cache: false,
        success: function(data) {
          this.setState({photoInfo: data.sizes});
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },
    
    onPhotoClicked: function() {
      AppDispatcher.dispatch({
        eventName: 'photoClicked',
        photoInfo: {
          id: this.props.id
        }
      });
    },
    
    componentDidMount: function() {
      this.loadPhotoFromServer();
    },
    
    render: function() {
      var url = '';
      if ((this.state.photoInfo) && (this.state.photoInfo.size)) {
        this.state.photoInfo.size.forEach(function(size, index, array) {
          if (size.label === "Large Square") {
            url = size.source;
          }
        });
      }
      return (
        <div className="Photo">
          <a href="javascript:;">
            <img src={url} alt={this.props.title} onClick={this.onPhotoClicked} />
          </a>
        </div>
      );
    }
  });

  var PhotoGallery = React.createClass({
    getInitialState: function() {
      return {photoArray: []};
    },

    loadRecentPhotosFromServer: function() {
      $.ajax({
        url: this.props.url + '?method=flickr.photos.getRecent&per_page=' + FLICKR_NUM_PHOTOS_RETRIEVED + '&' + FLICKR_FORMAT_URL_QUERY + '&' + FLICKR_API_URL_QUERY,
        cache: false,
        success: function(data) {
          AppDispatcher.dispatch({
            eventName: 'photoListReceived',
            photos: data.photos
          });
          
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },
    
    onPhotosAvailable: function() {
      this.setState({ photoArray: PhotoGalleryStore.getAll() });
    },
    
    componentWillUnmount: function() {
      PhotoGalleryStore.unbind('photosAvailable', this.onPhotosAvailable);
      PhotoGalleryStore.clear();
    },
    
    componentDidMount: function() {
      PhotoGalleryStore.bind('photosAvailable', this.onPhotosAvailable);
      
      if (!this.props.focusPhotoId) {
        this.loadRecentPhotosFromServer();
      }
    },

    render: function() {
      var galleryItems = [];
      var idx;
      
      for (idx = 0; idx < this.state.photoArray.length; idx++) {
        var item = this.state.photoArray[idx];
        galleryItems.push(
          <Photo 
            id={item.id} 
            key={item.id} 
            owner={item.owner} 
            title={item.title} 
            secret={item.secret} 
            url={this.props.url} 
          />
        );
      }
      
      return (
        <div className="PhotoGallery">
          {galleryItems}
        </div>
      );
    }
  });

  var PhotoGalleryTable = React.createClass({
    handleUserClick: function(photoId) {
      var anchorMap = _anchorMap;
      
      if (photoId == '') {
        return;
      }
      
      anchorMap['id'] = photoId;
      
      // Begin attempt to update URI: revert if not successful
      try {
        $.uriAnchor.setAnchor(anchorMap);
      } catch ( error ) {
        // replace URI with existing state
        anchorMap = _anchorMap;
        $.uriAnchor.setAnchor(_anchorMap, null, true );
      }
      
      _anchorMap = anchorMap;
    },
    
    onFocusPhotoChange: function() {
      var photos = FocusPhotoStore.getAll();
      photos.forEach(function(photo, index, array) {
        this.handleUserClick(photo.id)
      }.bind(this));
      FocusPhotoStore.clear();
    },
    
    componentWillUnmount: function() {
      FocusPhotoStore.unbind('focusPhotoChange', this.onFocusPhotoChange);
    },
    
    componentDidMount: function() {
      FocusPhotoStore.bind('focusPhotoChange', this.onFocusPhotoChange);
    },
    
    render: function() {
      var divBody = [];
      if (this.props.focusPhotoId) {
        divBody.push(<FocusPhotoExit key="photoExit" />);
        divBody.push(<FocusPhoto id={this.props.focusPhotoId} url={this.props.url} key={this.props.focusPhotoId} />);
      } else {
        divBody.push(<PhotoGallery url={this.props.url} key="photoGallery" />);
      }
      return (
        <div className="PhotoGalleryTable">
          {divBody}
        </div>
      );
    }
  });
  
  var AppDispatcher = new Flux.Dispatcher();
  
  var PhotoGalleryStore = {
    
    photos: [],
    
    clear: function() {
      this.photos = [];
    },
    
    getAll: function() {
      return this.photos;
    }
  };
  
  var FocusPhotoStore = {
    
    focusPhotos: [],
    
    clear: function() {
      this.focusPhotos = [];
    },
    
    getAll: function() {
      return this.focusPhotos;
    }
  };
  
  AppDispatcher.register(function(payload) {
    
    switch( payload.eventName ) {
      case 'photoListReceived':
        PhotoGalleryStore.photos = payload.photos.photo;
        PhotoGalleryStore.trigger('photosAvailable');
        break;
      
      case 'photoClicked':
        FocusPhotoStore.focusPhotos.push(payload.photoInfo);
        FocusPhotoStore.trigger('focusPhotoChange');
        break;
    }

    return true; // Needed for Flux promise resolution
  }); 
  
  MicroEvent.mixin(PhotoGalleryStore);
  MicroEvent.mixin(FocusPhotoStore);
  
  var onHashchange = function (event) {
    var anchorMapProposed, anchorMapPrevious = {};
    
    // attempt to parse the anchor
    try {
      anchorMapProposed = $.uriAnchor.makeAnchorMap();
    } catch ( error ) {
      $.uriAnchor.setAnchor( anchorMapPrevious, null, true );
      return;
    }
    
    for (var anchor in anchorMapProposed) {
      if ((anchor === 'id') || (anchor === '_s_id')) {
        _anchorMap[anchor] = anchorMapProposed[anchor];
      }
    }
    
    _photoId = anchorMapProposed._s_id;
    
    renderReactDom();
  };
  
  var renderReactDom = function() {
    ReactDOM.render(
      <PhotoGalleryTable url="https://api.flickr.com/services/rest/" focusPhotoId={_photoId} />,
      document.getElementById('container')
    );
  }
  
  $(window)
    .bind('hashchange', onHashchange)
    .trigger('hashchange');
  
  renderReactDom();
}());
