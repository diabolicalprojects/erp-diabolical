const createCrudRouter = require('./factory/crudRouter');
const Project = require('../models/Project');

module.exports = createCrudRouter({
  model: Project,
  label: 'Proyecto'
});
