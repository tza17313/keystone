/**
 @description: 根据用户权限过滤显示的栏目
 @date: 2019/1/9
 @author: 雷利(Rayleight@baie.com.cn)
 */

/**
 * 根据用户权限过滤显示的栏目
 * @param nav
 * @param user
 * @returns Array
 */
function navFilter(nav,user) {
	if(!user || !user.authModel){
		return nav
	}
	let userAuthModels=user.authModel.map((authModel)=>{
		return authModel.code
	})
	
	let resultNav=[]
	for (let i = 0; i < nav.length; i++) {
		let navElement = nav[i]
		let tempLists=navElement.lists.filter((navItem)=>{
			return userAuthModels.includes(navItem.key)
		})
		if(tempLists.length){
			resultNav.push({
				...navElement,
				lists:tempLists
			})
		}
	}
	return resultNav
}

function getNavAfterFilter(nav,user) {
	if(!user || !user.authModel){
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

console.log(getNavAfterFilter(nav,user))
// module.exports = navFilter;
