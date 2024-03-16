     module.exports = {
       apps: [
         {
           name: 'Customer',
           script: 'bootstrap.js',
           cwd: './customer/src'
         },
         {
           name: 'Media',
           script: 'bootstrap.js',
           cwd: './media/src'
         },
         {
           name: 'Products',
           script: 'index.js',
           cwd: './products/src'
         },
         {
           name: 'Sellers',
           script: 'bootstrap.js',
           cwd: './sellers/src'
         }
       ]
     };