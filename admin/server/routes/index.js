var _ = require('lodash');
var ejs = require('ejs');
var path = require('path');

var templatePath = path.resolve(__dirname, '../templates/index.html');

module.exports = function IndexRoute (req, res) {
	var keystone = req.keystone;
	var lists = {};
	_.forEach(keystone.lists, function (list, key) {
		lists[key] = list.getOptions();
	});

	var UserList = keystone.list(keystone.get('user model'));

	var orphanedLists = keystone.getOrphanedLists().map(function (list) {
		return _.pick(list, ['key', 'label', 'path']);
	});

	var backUrl = keystone.get('back url');
	if (backUrl === undefined) {
		// backUrl can be falsy, to disable the link altogether
		// but if it's undefined, default it to "/"
		backUrl = '/';
	}
	
	const userForKeystone={
		id: req.user.id,
		authModel:req.user.authModel,
		name: UserList.getDocumentName(req.user) || '(no name)',
	}
	
	var keystoneData = {
		adminPath: '/' + keystone.get('admin path'),
		appversion: keystone.get('appversion'),
		backUrl: backUrl,
		brand: keystone.get('brand'),
		csrf: { header: {} },
		devMode: !!process.env.KEYSTONE_DEV,
		lists: lists,
		nav: getNavAfterFilter(keystone.nav,userForKeystone,lists[keystone.get('user model')]),
		orphanedLists: orphanedLists,
		signoutUrl: keystone.get('signout url'),
		user: userForKeystone,
		userList: UserList.key,
		version: keystone.version,
		wysiwyg: { options: {
			enableImages: keystone.get('wysiwyg images') ? true : false,
			enableCloudinaryUploads: keystone.get('wysiwyg cloudinary images') ? true : false,
			enableS3Uploads: keystone.get('wysiwyg s3 images') ? true : false,
			additionalButtons: keystone.get('wysiwyg additional buttons') || '',
			additionalPlugins: keystone.get('wysiwyg additional plugins') || '',
			additionalOptions: keystone.get('wysiwyg additional options') || {},
			overrideToolbar: keystone.get('wysiwyg override toolbar'),
			skin: keystone.get('wysiwyg skin') || 'keystone',
			menubar: keystone.get('wysiwyg menubar'),
			importcss: keystone.get('wysiwyg importcss') || '',
		} },
	};
	keystoneData.csrf.header[keystone.security.csrf.CSRF_HEADER_KEY] = keystone.security.csrf.getToken(req, res);

	var codemirrorPath = keystone.get('codemirror url path')
		? '/' + keystone.get('codemirror url path')
		: '/' + keystone.get('admin path') + '/js/lib/codemirror';

	var locals = {
		adminPath: keystoneData.adminPath,
		cloudinaryScript: false,
		codemirrorPath: codemirrorPath,
		env: keystone.get('env'),
		fieldTypes: keystone.fieldTypes,
		ga: {
			property: keystone.get('ga property'),
			domain: keystone.get('ga domain'),
		},
		keystone: keystoneData,
		title: keystone.get('name') || 'Keystone',
	};

	var cloudinaryConfig = keystone.get('cloudinary config');
	if (cloudinaryConfig) {
		var cloudinary = require('cloudinary');
		var cloudinaryUpload = cloudinary.uploader.direct_upload();
		keystoneData.cloudinary = {
			cloud_name: keystone.get('cloudinary config').cloud_name,
			api_key: keystone.get('cloudinary config').api_key,
			timestamp: cloudinaryUpload.hidden_fields.timestamp,
			signature: cloudinaryUpload.hidden_fields.signature,
		};
		locals.cloudinaryScript = cloudinary.cloudinary_js_config();
	};

	ejs.renderFile(templatePath, locals, { delimiter: '%' }, function (err, str) {
		if (err) {
			console.error('Could not render Admin UI Index Template:', err);
			return res.status(500).send(keystone.wrapHTMLError('Error Rendering Admin UI', err.message));
		}
		res.send(str);
	});
};




function getNavAfterFilter(nav,user,usermodel) {
	if(!user || !user.authModel){
		return nav
	}
	if(!usermodel || !usermodel.fields || !usermodel.fields.authModel){
		return nav
	}
	let userAuthModels=user.authModel.map((authModel)=>{
		return authModel.code
	})
	
	const {sections,by}=nav
	
	let resultSections=[]
	for (let i = 0; i < sections.length; i++) {
		let navElement = sections[i]
		let tempLists=filterList(navElement.lists,userAuthModels)
		if(tempLists.length){
			resultSections.push({
				...navElement,
				lists:tempLists
			})
		}
	}
	
	let byList={}
	for (const listKey in by.list) {
		let listItem=by.list[listKey]
		let listItemLists=filterList(listItem.lists,userAuthModels)
		if(listItemLists.length){
			byList[listKey]={
				...listItem,
				lists:listItemLists
			}
		}
	}
	
	let bySections={}
	for (const sectionKey in by.section) {
		let listItem=by.section[sectionKey]
		let listItemLists=filterList(listItem.lists,userAuthModels)
		if(listItemLists.length){
			bySections[sectionKey]={
				...listItem,
				lists:listItemLists
			}
		}
	}
	
	return {
		by:{
			list:byList,
			section:bySections
		},
		sections:resultSections
	}
	
	
	function filterList(list,userAuthModels) {
		return list.filter((i)=>{
			return userAuthModels.includes(i.key)
		})
	}
}
