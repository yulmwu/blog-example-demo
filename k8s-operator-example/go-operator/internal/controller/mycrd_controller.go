package controller

import (
	"context"
	"fmt"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	demov1alpha1 "mycrd-operator/api/v1alpha1"
)

// MyCRDReconciler reconciles a MyCRD object
type MyCRDReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// RBAC: CRD 자체 + status + finalizers
//+kubebuilder:rbac:groups=demo.example.com,resources=mycrds,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=demo.example.com,resources=mycrds/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=demo.example.com,resources=mycrds/finalizers,verbs=update

// RBAC: 오브젝트를 만들/읽을 권한 (Deployment, Pod)
/// deployments를 생성/업데이트/조회
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
/// pods 조회 (상태 반영용)
//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch

func (r *MyCRDReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx).WithValues("mycrd", req.NamespacedName)

	// 1) MyCRD 리소스 가져오기
	var my demov1alpha1.MyCRD
	if err := r.Get(ctx, req.NamespacedName, &my); err != nil {
		if errors.IsNotFound(err) {
			// 삭제됨
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	// 기본값
	var replicas int32 = 1
	if my.Spec.Replicas != nil {
		replicas = *my.Spec.Replicas
	}
	image := my.Spec.Image
	if image == "" {
		image = "nginx:1.25.3"
	}

	// 2) 자식 Deployment 정의 (이름/라벨)
	deployName := fmt.Sprintf("%s-deploy", my.Name)
	labels := map[string]string{
		"app":   my.Name,
		"mycrd": my.Name,
	}

	// 3) Deployment 객체 틀
	var deploy appsv1.Deployment
	deploy.Namespace = my.Namespace
	deploy.Name = deployName

	// 4) CreateOrUpdate로 생성/갱신
	mutate := func() error {
		// OwnerReference 설정 (MyCRD 삭제 시 Deployment 자동 정리)
		if err := controllerutil.SetControllerReference(&my, &deploy, r.Scheme); err != nil {
			return err
		}

		// Selector는 생성 시점과 동일해야 함(불변)
		if deploy.Spec.Selector == nil {
			deploy.Spec.Selector = &metav1.LabelSelector{MatchLabels: labels}
		}

		deploy.Spec.Replicas = &replicas
		deploy.Spec.Template.ObjectMeta.Labels = labels
		deploy.Spec.Template.Spec = corev1.PodSpec{
			Containers: []corev1.Container{
				{
					Name:  "app",
					Image: image,
					Ports: []corev1.ContainerPort{{Name: "http", ContainerPort: 80}},
				},
			},
		}
		return nil
	}

	op, err := controllerutil.CreateOrUpdate(ctx, r.Client, &deploy, mutate)
	if err != nil {
		return ctrl.Result{}, err
	}
	logger.Info("Deployment reconciled", "operation", op, "replicas", replicas, "image", image)

	// 5) Status 갱신 (가용 파드 수)
	//    최신 상태 다시 조회 후 my.Status에 반영
	var fresh appsv1.Deployment
	if err := r.Get(ctx, types.NamespacedName{Name: deployName, Namespace: my.Namespace}, &fresh); err == nil {
		if my.Status.AvailableReplicas != fresh.Status.AvailableReplicas {
			my.Status.AvailableReplicas = fresh.Status.AvailableReplicas
			if err := r.Status().Update(ctx, &my); err != nil {
				// Status 업데이트 실패는 재시도 유도
				logger.Error(err, "failed to update MyCRD status")
				return ctrl.Result{}, err
			}
		}
	}

	// 정상 완료
	return ctrl.Result{}, nil
}

func (r *MyCRDReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&demov1alpha1.MyCRD{}).
		Owns(&appsv1.Deployment{}).
		Complete(r)
}
