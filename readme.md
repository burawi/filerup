# Installation
```
npm i filerup
```

# Init
```javascript
var filerup = require('filerup')(app);
```
# Usage
```javascript
app.use('/upload', function (req, res) {;
    var msg = filerup.upload(req,{
        fields: ['avatar'], // Default: all fields
        types: ['bmp','png'], // Default: all types
        dist: './public/uploads', // Default: './uploads'
        maxSize: '1Mb', // Default: 2Mb
        together: false // Default: true
    });
    res.json({msg: msg});
})
// returns: {
//     path: array of paths of files stored,
//     report: a report object of booleans on filters if a filter does not pass it is set to false
// }
```

# Options
- fields: fields if you want to restrict fields from form
- types: list of accepted types
- dist: destination folder
- maxSize: maximum file size
- together: store files together, if one of them is not valid don't put it
