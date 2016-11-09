
var flickrwa.FocusPhotoExit = React.createClass({
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
