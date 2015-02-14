FlipFlopFBO = function (options) {
	this.fbo1 = new GLOW.FBO(options);
	this.fbo2 = new GLOW.FBO(_.omit(options, "data"));
	this.texture = this.fbo1;
	this.target = this.fbo2;
};

FlipFlopFBO.prototype.flip = function () {
	var oldTexture = this.texture;
	this.texture = this.target;
	this.target = oldTexture;
};